
figma.showUI(__html__, { width: 400, height: 550 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'update-layers') {
    const nodes = figma.currentPage.selection.filter(node => node.type === 'FRAME' || node.type === 'INSTANCE');

    if (nodes.length === 0) {
      figma.notify("Selecciona al menos un frame o instancia para actualizar");
      return;
    }

    // Notify the UI that synchronization is in progress
    figma.ui.postMessage({ status: 'syncing' });

    // Parse the pasted table data
    const dataRows = msg.data.split('\n');
    const headers = dataRows[0].split('\t');
    const valuesArray = dataRows.slice(1).map(row => row.split('\t'));

    if (nodes.length > valuesArray.length) {
      figma.notify("Hay más elementos seleccionados que filas de datos. Selecciona menos elementos o añade más filas de datos.");
      return;
    }

    try {
      for (let index = 0; index < nodes.length; index++) {
        const node = nodes[index];
        const values = valuesArray[index];

        // Function to find layers by name recursively inside frames or instances
        const findLayersRecursively = (node, header) => {
          if (node.name === header) {
            return node;
          }
          if ("children" in node) {
            for (const child of node.children) {
              const found = findLayersRecursively(child, header);
              if (found) return found;
            }
          }
          return null;
        };

        for (let i = 0; i < headers.length; i++) {
          const header = headers[i].trim();
          const value = values[i].trim();

          const layer = findLayersRecursively(node, header);

          if (layer) {
            try {
              // Update text layers
              if (layer.type === 'TEXT') {
                await figma.loadFontAsync(layer.fontName);
                layer.characters = value;
              }
              // Update image layers
              else if (layer.type === 'RECTANGLE' && value.startsWith('http')) {
                const response = await fetch(value);
                if (!response.ok) throw new Error('Failed to fetch image');
                const imageData = await response.arrayBuffer();
                const imageHash = figma.createImage(new Uint8Array(imageData)).hash;
                layer.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash }];
              }
            } catch (error) {
              console.error('Error actualizando capa:', error);
              figma.notify('Error al actualizar la capa: ' + header);
            }
          }
        }
      }
      // Notify the UI that the update was successful
      figma.ui.postMessage({ status: 'success' });
      figma.notify("Frames e instancias actualizados con éxito");
    } catch (error) {
      console.error('Error actualizando capa:', error);
      figma.notify('Error al actualizar capas.');
      figma.ui.postMessage({ status: 'error' });
    }
  }
};
