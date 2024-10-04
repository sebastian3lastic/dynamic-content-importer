// Función que reemplaza el contenido en los componentes seleccionados
async function replaceContent(pastedData) {
    const selectedNodes = figma.currentPage.selection;
  
    if (selectedNodes.length === 0) {
      figma.notify('Selecciona al menos un componente.');
      console.log('No hay componentes seleccionados.');
      return;
    }
    
    console.log('Componentes seleccionados:', selectedNodes);
  
    // Separar las líneas del contenido pegado
    const rows = pastedData.trim().split('\n');
    console.log('Filas de datos:', rows);
  
    // Obtener los headers (nombres de las columnas) de la primera fila
    const headers = rows[0].trim().split('\t');
    console.log('Encabezados:', headers);
  
    // Procesar el resto de las filas
    const data = rows.slice(1).map(row => {
      const values = row.trim().split('\t');
      const rowData = {};
  
      // Mapear los valores a los headers (columna a valor)
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });
  
      return rowData;
    });
  
    console.log('Datos procesados:', data);
  
    // Aplicar los datos a los componentes seleccionados
    selectedNodes.forEach(async (node, index) => {
      const rowData = data[index]; // Vincula cada nodo con una fila de datos
      if (!rowData) {
        console.log('No hay datos para el componente en el índice:', index);
        return;
      }
      
      console.log('Aplicando datos al nodo:', node, 'con datos:', rowData);
  
      node.children.forEach(async (child) => {
        console.log('Revisando capa:', child.name, 'de tipo:', child.type);
  
        // Verificar si es una capa de texto antes de cambiar el texto
        if (child.type === 'TEXT') {
          if (child.name === '#titleLeft1') {
            console.log('Cambiando texto en #titleLeft1:', rowData['#titleLeft1']);
            child.characters = rowData['#titleLeft1'];
          } else if (child.name === '#titleLeft2') {
            console.log('Cambiando texto en #titleLeft2:', rowData['#titleLeft2']);
            child.characters = rowData['#titleLeft2'];
          } else if (child.name === '#bodyLeft1') {
            console.log('Cambiando texto en #bodyLeft1:', rowData['#bodyLeft1']);
            child.characters = rowData['#bodyLeft1'];
          } else if (child.name === '#bodyRight1') {
            console.log('Cambiando texto en #bodyRight1:', rowData['#bodyRight1']);
            child.characters = rowData['#bodyRight1'];
          } else if (child.name === '#titleRight1') {
            console.log('Cambiando texto en #titleRight1:', rowData['#titleRight1']);
            child.characters = rowData['#titleRight1'];
          }
        }
  
        // Verificar si es una capa de imagen antes de cambiar el relleno de imagen
        if (child.name === '#image' && (child.type === 'RECTANGLE' || child.type === 'FRAME')) {
          try {
            console.log('Intentando cargar imagen en #image:', rowData['#image']);
            const newFills = clone(child.fills);
            const imageHash = await loadImageFromUrl(rowData['#image']);
            
            if (imageHash) {
              // Crear el objeto de relleno correctamente
              newFills[0] = {
                type: 'IMAGE',
                imageHash: imageHash,
                scaleMode: 'FILL', // Puedes cambiar el modo de ajuste de imagen aquí si lo necesitas
              };
              child.fills = newFills;
              console.log('Imagen aplicada correctamente.');
            } else {
              console.log('No se pudo obtener el hash de la imagen:', rowData['#image']);
            }
          } catch (error) {
            console.error('Error al cargar la imagen:', error);
          }
        }
      });
    });
  
    figma.notify('Datos importados con éxito');
  }
  
  // Escuchar mensajes del UI para recibir los datos pegados
  figma.ui.onmessage = (msg) => {
    if (msg.type === 'import-data') {
      console.log('Datos recibidos de la UI:', msg.content);
      replaceContent(msg.content).then(() => {
        figma.ui.postMessage('success');
      }).catch(error => {
        console.error(error);
        figma.ui.postMessage('error');
      });
    }
  };
  
  // Función para cargar imágenes desde URLs con manejo de errores
  async function loadImageFromUrl(url) {
    try {
      console.log('Cargando imagen desde URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Error al cargar la imagen. HTTP status:', response.status);
        return null;
      }
  
      const arrayBuffer = await response.arrayBuffer();
      const image = figma.createImage(new Uint8Array(arrayBuffer));
      console.log('Imagen cargada, hash:', image.hash);
      return image.hash;
    } catch (error) {
      console.error('Error al cargar la imagen desde URL:', error);
      return null;
    }
  }
  
  // Helper function para clonar objetos
  function clone(val) {
    return JSON.parse(JSON.stringify(val));
  }
  
  figma.showUI(__html__, {
    width: 400,  // Ancho en píxeles
    height: 500  // Alto en píxeles (ajústalo según lo que necesites)
  });
  