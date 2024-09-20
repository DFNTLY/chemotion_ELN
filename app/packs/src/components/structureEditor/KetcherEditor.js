/* eslint-disable react/require-default-props */
/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

function KetcherEditor(props) {
  const iframeRef = useRef();
  const [editorS] = useState(props.editor);
  let {
    iH, iS, molfile
  } = props;

  const initMol = molfile
    || '\n  noname\n\n  0  0  0  0  0  0  0  0  0  0999 V2000\nM  END\n';

  const loadContent = async (event) => {
    if (event.data.eventType === 'init') {
      editorS.structureDef.editor.setMolecule(initMol);
      editorS._structureDef.editor.editor.subscribe('change', async (eventData) => {
        const result = await eventData;
        handleEditorChangeEvent(result);
      });
    };
  };

  async function handleEditorChangeEvent(data) {
    let ketFormat = await editorS.structureDef.editor.getKet();
    ketFormat = JSON.parse(ketFormat);
    let allNodes = [...ketFormat.root.nodes];

    const images = [];
    allNodes.forEach((item, idx) => {
      if (item?.type === 'image') {
        images.push(allNodes[idx]);
      }
    });

    const mols = [];
    Object.keys(ketFormat)?.forEach((item) => {
      if (ketFormat[item]?.atoms?.length && ketFormat[item]?.atoms[0]?.alias) mols.push(item);
    });

    data.forEach(async (item) => {
      switch (item?.operation) {
        case "Move image":
          const images_list = ketFormat.root.nodes.slice(allNodes.length - mols.length, allNodes.length);
          images_list.forEach((item, idx) => {
            const location = {
              x: item.boundingBox.x + item.boundingBox.width / 2,
              y: item.boundingBox.y - item.boundingBox.height / 2,
              z: 0
            };
            if (ketFormat[mols[idx]].atoms[0].alias) {
              ketFormat[mols[idx]].atoms[0].location = [...Object.values(location)];
              console.log(ketFormat[mols[idx]].atoms[0]);
              if (ketFormat[mols[idx]].atoms[1]) {
                ketFormat[mols[idx]].atoms[1].location = Object.values(location);
              }
              ketFormat[mols[idx]].stereoFlagPosition = location;
            }
          });
          editorS.structureDef.editor.setMolecule(JSON.stringify(ketFormat));
          break;
        case "Add atom":
          if (ketFormat[`mol${Object.keys(ketFormat).length - 2}`]?.atoms[1]?.label == "H") {
            delete ketFormat[`mol${Object.keys(ketFormat).length - 2}`].sgroups;
            delete ketFormat[`mol${Object.keys(ketFormat).length - 2}`].bonds;
            ketFormat[`mol${Object.keys(ketFormat).length - 2}`].atoms.splice(1, 1);
            editorS.structureDef.editor.setMolecule(JSON.stringify(ketFormat));
          }
          break;
        case "Upsert image!":

          break;
        default:
          break;

      }
      // editorS.structureDef.editor.setMolecule(JSON.stringify(ketFormat));
    });
  }

  useEffect(() => {
    window.addEventListener('message', loadContent);
    return () => {
      window.removeEventListener('message', loadContent);
    };
  }, []);

  return (
    <div>
      <iframe
        ref={iframeRef}
        id={editorS.id}
        src={editorS.extSrc}
        title={editorS.label}
        height={iH}
        width="100%"
        style={iS}
      />
    </div>
  );
};

KetcherEditor.propTypes = {
  molfile: PropTypes.string,
  editor: PropTypes.object.isRequired,
  iH: PropTypes.string.isRequired,
  iS: PropTypes.object.isRequired,
};

export default KetcherEditor;;;;
