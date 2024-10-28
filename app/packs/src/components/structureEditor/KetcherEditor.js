/* eslint-disable react/require-default-props */
/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  // data stores
  three_parts_patten,
  two_parts_pattern,

  // flags
  skip_template_name_hide,
  skip_image_layering,
  images_to_be_updated,
  allowed_to_process,

  // methods
  hasKetcherData,
  adding_polymers_ketcher_format,
  adding_polymers_indigo_molfile,
  prepareImageFromTemplateList,
  resetOtherAliasCounters,
  isNewAtom,

  // DOM Methods
  disableButton,
  attachListenerForTitle,
  updateImagesInTheCanvas,
  updateTemplatesInTheCanvas,

  // setters
  images_to_be_updated_setter,
  allowed_to_process_setter,

  // tags
  inspired_label,
  rails_polymer_identifier
} from '../../utilities/Ketcher2SurfaceChemistryUtils';

let FILOStack = [];
let uniqueEvents = new Set();
let latestData = null;
let imagesList = [];
let mols = [];
let allNodes = [];
let all_atoms = [];
let image_used_counter = -1;
let re_render_canvas = false;
let atoms_to_be_deleted = [];
let new_atoms = [];

// funcation to reset all data containers
const resetStore = () => {
  FILOStack = [];
  uniqueEvents = new Set();
  latestData = null;
  imagesList = [];
  mols = [];
  allNodes = [];
  image_used_counter = -1;
  re_render_canvas = false;
};

const KetcherEditor = forwardRef((props, ref) => {
  const { editor, iH, iS, molfile } = props;
  const iframeRef = useRef();
  let initMol = molfile || '\n  noname\n\n  0  0  0  0  0  0  0  0  0  0999 V2000\nM  END\n';

  // Handlers for each event operation, mapped by operation name
  const eventOperationHandlers = {
    "Load canvas": async () => {
      await fuelKetcherData();
      if (re_render_canvas) await moveTemplate();
    },
    "Move image": async () => {
      addEventToFILOStack("Move image");
    },
    "Set atom attribute": async (eventItem) => {
      if (isNewAtom(eventItem)) {
        new_atoms.push(eventItem);
      }
      addEventToFILOStack("Add atom");
    },
    "Add atom": async (eventItem) => {
      if (isNewAtom(eventItem)) {
        new_atoms.push(eventItem);
      }
      addEventToFILOStack("Add atom");
    },
    "Upsert image": async () => {
      addEventToFILOStack("Upsert image");
    },
    "Move atom": async (eventItem) => {
      const { exists } = should_canvas_update_on_movement(eventItem);
      allowed_to_process_setter(exists);
      addEventToFILOStack("Move atom");
    },
    "Delete image": async () => {
      console.log("Delete image");
      // await editor._structureDef.editor.editor.undo();
    },
    "Delete atom": async (eventItem) => {
      console.log("DELETE ATOM!!");
      const { atom } = should_canvas_update_on_movement(eventItem);
      if (eventItem.label === inspired_label) atoms_to_be_deleted.push(atom);
    },
    "Update": async () => {
      // Optional logic for update, e.g., logging
      // console.log({ Update: eventItem });
    },
  };

  // action based on event-name
  const eventHandlers = {
    'Load canvas': async () => await fuelKetcherData(),
    'Move image': async () => await moveTemplate(),
    'Move atom': async () => await moveTemplate(),
    'Add atom': async () => await handleAddAtom(),
    'Delete image': async () => console.log("Delete image"),
    // 'Upsert image': async () => await postAtomAddImageInsertion(),
  };

  // DOM button events with scope
  const buttonEvents = {
    "[title='Clean Up \\(Ctrl\\+Shift\\+L\\)']": async () => {
      await fuelKetcherData();
      re_render_canvas = true;
    },
    "[title='Layout \\(Ctrl\\+L\\)']": async () => {
      await fuelKetcherData();
      re_render_canvas = true;
    },
    "[title='Clear Canvas \\(Ctrl\\+Del\\)']": async () => {
      image_used_counter = -1;
    },
    "[title='Undo \\(Ctrl\\+Z\\)']": () => {
      // TODO:pattern identify
    },
    "[title='Redo \\(Ctrl\\+Shift\\+Z\\)']": () => {
      // TODO:pattern identify
    },
    'Erase \\(Del\\)': () => {
      // TODO:pattern identify
    }
  };

  useEffect(() => {
    resetStore();
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', attachClickListeners); // DOM change listener
    }
    window.addEventListener('message', loadContent); // molfile intializer

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', attachClickListeners);
      }
      window.removeEventListener('message', loadContent);
    };
  }, []);

  // helper function to rebase with the ketcher canvas data
  const fuelKetcherData = async () => {
    all_atoms = [];
    latestData = JSON.parse(await editor.structureDef.editor.getKet());
    allNodes = [...latestData.root.nodes];
    imagesList = allNodes.length > mols.length ? allNodes.filter(
      item => item.type === 'image'
    ) : imagesList;
    mols = allNodes.slice(0, allNodes.length - imagesList.length).map(i => i.$ref);
    mols.forEach((item) => latestData[item]?.atoms.map(i => all_atoms.push(i)));
    // console.log("DATA FUELED", { image_used_counter, latestData, allNodes, imagesList, mols, decision: allNodes.length > mols.length });
  };

  // enable editor change listener
  const onEditorContentChange = (editor) => {
    editor._structureDef.editor.editor.subscribe('change', async (eventData) => {
      const result = await eventData;
      handleEventCapture(result);
    });

    editor._structureDef.editor.editor.subscribe('selectionChange', async (eventData) => {
      const result = await eventData;
    });

    editor._structureDef.editor.editor.subscribe('click', async (eventData) => {
      const result = await eventData;
      const atom = editor._structureDef.editor.editor._selection?.atoms;
      if (atom) {
        console.log({ atom: all_atoms[atom[0]] });
      }
    });


  };

  // Load the editor content and set up the molecule
  const loadContent = async (event) => {
    if (event.data.eventType === 'init') {
      window.editor = editor;
      await hasKetcherData(initMol, async ({ struct, rails_polymers_list }) => {
        await editor.structureDef.editor.setMolecule(struct); // set initial
        await setKetcherData({ rails_polymers_list }); // process polymers
        onEditorContentChange(editor); // subscribe to editor change
      });
    };
  };

  // helper function to calculate counters for the ketcher2 setup based on file source type
  const setKetcherData = async ({ rails_polymers_list }) => {
    await fuelKetcherData();
    let collected_images = [];
    if (rails_polymers_list) {
      const { c_images, molfileData, image_counter } = adding_polymers_ketcher_format(rails_polymers_list, mols, latestData, image_used_counter);
      collected_images = c_images;
      image_used_counter = image_counter;
      latestData = { ...molfileData };
    } else { // type == "Indigo"
      const { c_images, molfileData } = adding_polymers_indigo_molfile();
      latestData = { ...molfileData };
      collected_images = c_images;
    }
    latestData?.root?.nodes.push(...collected_images);
    await editor.structureDef.editor.setMolecule(JSON.stringify(latestData));
    await fuelKetcherData();
    await moveTemplate();
  };

  // main funcation to capture all events from editor
  const handleEventCapture = async (data) => {
    const selection = editor._structureDef.editor.editor._selection;
    if (selection?.images) {
      await editor.structureDef.editor.setMolecule(JSON.stringify(latestData));
      await fuelKetcherData();
      return;
      // addEventToFILOStack("Move image");
    }

    for (const eventItem of data) {
      const operationHandler = eventOperationHandlers[eventItem?.operation];
      if (operationHandler) {
        await operationHandler(eventItem);
      }
    }

    if (allowed_to_process) {
      processFILOStack();
    } else {
      FILOStack = [];
      uniqueEvents = new Set();
      return;
    }
  };

  // all logic implementation if move atom has an alias which passed three part regex
  const should_canvas_update_on_movement = (eventItem) => {
    const { id } = eventItem;
    const target_atom = all_atoms[id];
    if (target_atom) {
      return { exists: three_parts_patten.test(target_atom.alias), atom: target_atom };
    }
    return { exists: true, atom: target_atom };
  };

  // helper function to add event to stack
  const addEventToFILOStack = (event) => {
    if (!uniqueEvents.has(event)) {
      FILOStack.push(event);
      uniqueEvents.add(event);
    }
  };

  // helper function to ececute a stack: first in last out
  const processFILOStack = async () => {
    await fuelKetcherData();
    if (!latestData) {
      alert("data not present!!");
      return;
    }

    if (atoms_to_be_deleted.length) { // reduce template indentifier based on the deleted templates
      for (let i = 0; i < atoms_to_be_deleted.length; i++) {
        const item = atoms_to_be_deleted[i];
        await onEventDeleteAtom(item);
      }
      await editor.structureDef.editor.setMolecule(JSON.stringify(latestData));
      image_used_counter = image_used_counter - atoms_to_be_deleted.length;
      atoms_to_be_deleted = [];
      return;
    }

    const loadCanvasIndex = FILOStack.indexOf("Load canvas");
    if (loadCanvasIndex > -1) {
      FILOStack.splice(loadCanvasIndex, 1);
      uniqueEvents.delete("Load canvas");
    }

    while (FILOStack.length > 0) {
      const event = FILOStack.pop();
      uniqueEvents.delete(event);
      if (eventHandlers[event]) {
        await eventHandlers[event]();
      }
    }
    if (images_to_be_updated && !skip_image_layering) {
      setTimeout(async () => {
        await updateImagesInTheCanvas(iframeRef);
      }, [250]);
    }
  };

  // helper function to place image on atom location coordinates
  const placeImageOnAtoms = async (mols_, imagesList_) => {
    await fuelKetcherData();
    mols_.forEach((item) => {
      latestData[item]?.atoms.forEach((atom) => {
        if (atom && three_parts_patten.test(atom?.alias)) {
          const splits_alias = atom.alias.split("_");
          let image_coordinates = imagesList_[parseInt(splits_alias[2])]?.boundingBox;
          image_coordinates = {
            ...image_coordinates,
            x: atom.location[0] - image_coordinates.width / 2,
            y: atom.location[1] + image_coordinates.height / 2,
            z: 0
          };
          imagesList_[splits_alias[2]].boundingBox = image_coordinates;
        };
      });
    });
    latestData.root.nodes = [...latestData.root.nodes.slice(0, mols_.length), ...imagesList_];
    await editor.structureDef.editor.setMolecule(JSON.stringify(latestData));
  };

  // helper function to move image and update molecule positions
  const moveTemplate = async () => {
    console.log("move template!!");
    mols.forEach(async (mol) => {
      const molecule = latestData[mol];

      // Check if molecule and atoms exist, and if the alias is formatted correctly
      molecule?.atoms?.forEach((item, atom_idx) => {
        if (item.alias) {
          const alias = item.alias.split("_");
          if (three_parts_patten.test(item.alias)) {
            const image = imagesList[alias[2]];
            if (image?.boundingBox) {
              const { x, y } = image?.boundingBox;
              const location = [x, y, 0]; // Set location as an array of coordinates
              // molecule.atoms[atom_idx].location = location; // enable this is you want to handle location based on images 
              molecule.atoms[atom_idx].alias = item.alias.trim();
              if (molecule?.stereoFlagPosition) {
                molecule.stereoFlagPosition = {
                  x: location[0],
                  y: location[1],
                  z: 0
                };
              }
            }
          }
        }
      });
      latestData[mol] = molecule;
    });
    latestData.root.nodes = latestData.root.nodes.slice(0, mols.length);
    await editor.structureDef.editor.setMolecule(JSON.stringify(latestData));
    re_render_canvas = false;
    images_to_be_updated_setter();
    imagesList.length && placeImageOnAtoms(mols, imagesList);
  };

  // helper function to handle new atoms added to the canvas
  const handleAddAtom = async () => {
    console.log("Atom moved!");
    await fuelKetcherData();
    let already_processed = [];
    const seenThirdParts = new Set();

    for (let m = 0; m < mols.length; m++) {
      const mol = latestData[mols[m]];
      for (let a = 0; a < mol.atoms.length; a++) {
        const atom = mol.atoms[a];
        if (atom?.alias && three_parts_patten.test(atom?.alias)) {
          const splits = atom?.alias?.split("_");
          if (!seenThirdParts.has(splits[2])) {
            already_processed.push(`${m}_${a}_${splits[2]}`);
            seenThirdParts.add(splits[2]);
          }
        }
      }
    }

    let new_images = [];
    // already_processed = already_processed.splice(-new_atoms.length);
    image_used_counter = already_processed.length - 1;
    // console.log({ already_processed, new_atoms, image_used_counter });

    for (let m = 0; m < mols.length; m++) {
      const mol = latestData[mols[m]];
      const is_h_id_list = [];
      for (let a = 0; a < mol.atoms.length; a++) {
        const atom = mol.atoms[a];
        const splits = atom?.alias?.split("_");
        // label A with three part alias
        if (two_parts_pattern.test(atom.alias)) {
          // console.log("TWO", { imagesList }, image_used_counter, atom.alias);
          image_used_counter += 1;
          if (!imagesList[image_used_counter]) {
            const img = prepareImageFromTemplateList(parseInt(splits[1]), atom.location);
            new_images.push(img);
          }
          atom.alias += `_${image_used_counter}`;
          already_processed.push(`${m}_${a}_${image_used_counter}`);
          // console.log("TWO END XXXXXXXXXXXXXXXXXXX", { imagesList }, image_used_counter, atom.alias);
        }
        else if (three_parts_patten.test(atom.alias)) {
          console.log("Three", `${m}_${a}_${splits[2]}`);
          if (already_processed.indexOf(`${m}_${a}_${splits[2]}`) != -1) {
            // console.warn("dying from existance!!!!!", atom.alias, image_used_counter, imagesList);
          } else {
            // console.log(atom.alias, "doesn't exists here!!!!", image_used_counter);
            image_used_counter += 1;
            atom.alias = `t_${splits[1]}_${image_used_counter}`;
            already_processed.push(`${m}_${a}_${image_used_counter}`);
          }
          // console.log("Three END XXXXXXXXXXXX", atom.alias, image_used_counter);
        }
        if (atom.label === "H") {
          is_h_id_list.push(atom);
        };
        console.log("-----------------------------");
      }
      if (is_h_id_list.length) {
        mol.atoms?.splice(mol.atoms.length - is_h_id_list.length, is_h_id_list.length);
        mol.bonds?.splice(mol.bonds.length - is_h_id_list.length, is_h_id_list.length);
      }
    }
    const d = { ...latestData };
    d.root.nodes = [...d.root.nodes, ...new_images];
    new_atoms = [];
    imagesList.push(...new_images);
    console.log("END", { imagesList, image_used_counter, imagesList });
    await editor.structureDef.editor.setMolecule(JSON.stringify(d));
    moveTemplate();
  };

  // helper function to delete a template and reset the counter, assign new alias to all atoms
  const onEventDeleteAtom = async (atom) => {
    try {
      if (!mols.length) await fuelKetcherData();
      latestData = resetOtherAliasCounters(atom, mols, latestData);
    } catch (err) {
      console.log({ err });
    };
  };

  // helper function to add mutation oberservers to DOM elements
  const attachClickListeners = () => {
    // Main function to attach listeners and observers
    if (iframeRef.current) {
      const iframeDocument = iframeRef.current.contentWindow.document;

      // Attach MutationObserver to listen for relevant DOM mutations (e.g., new buttons added)
      const observer = new MutationObserver(async (mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            Object.keys(buttonEvents).forEach((selector) => {
              attachListenerForTitle(iframeDocument, selector, buttonEvents);
            });

            // Disable buttons again in case they were added dynamically
            disableButton(iframeDocument, 'Undo \\(Ctrl\\+Z\\)');
            disableButton(iframeDocument, 'Redo \\(Ctrl\\+Shift\\+Z\\)');
            disableButton(iframeDocument, 'Erase \\(Del\\)');
          }
        }

        if (!skip_template_name_hide) {
          await updateTemplatesInTheCanvas(iframeRef);
        }
      });

      // Start observing the iframe's document for changes
      observer.observe(iframeDocument, {
        childList: true,
        subtree: true,
      });

      // Fallback: Try to manually find buttons after some time, debounce the function
      const debounceAttach = setTimeout(() => {
        Object.keys(buttonEvents).forEach((title) => {
          attachListenerForTitle(iframeDocument, title);
        });
      }, 1000);

      // Cleanup function
      return () => {
        observer.disconnect();
        clearTimeout(debounceAttach);
        Object.keys(buttonEvents).forEach((title) => {
          const button = iframeDocument.querySelector(`[title="${title}"]`);
          if (button) {
            button.removeEventListener('click', buttonEvents[title]);
          }
        });
      };
    }
  };

  // ref functions when a canvas is saved using main "SAVE" button
  useImperativeHandle(ref, () => ({
    onSaveFileK2SC: async () => {
      await fuelKetcherData();

      // molfile disection
      const canvas_data_Mol = await editor.structureDef.editor.getMolfile();
      const lines = canvas_data_Mol.split('\n');
      const elements_info = lines[3];
      const header_starting_from = 4;

      let [atoms_count, bonds_count] = elements_info.trim().split(" ").filter(i => i != "");
      atoms_count = parseInt(atoms_count);
      bonds_count = parseInt(bonds_count);
      const extra_data_start = header_starting_from + atoms_count + bonds_count;
      const extra_data_end = lines.length - 2;

      for (let i = extra_data_start; i < extra_data_end; i++) {
        const alias = lines[i];
        if (three_parts_patten.test(alias)) {
          const splits = parseInt(alias.split("_")[2]);
          if (imagesList[splits]) { // image found
            const { boundingBox } = imagesList[splits];
            if (boundingBox) {
              const { width, height } = boundingBox;
              lines[i] += `    ${height}    ${width}`;
            }
          }
        }
      }

      const iframeDocument = iframeRef.current.contentWindow.document;
      const svg = iframeDocument.querySelector('svg'); // Get the main SVG tag
      const imageElements = iframeDocument.querySelectorAll('image');
      imageElements.forEach((img) => {
        svg.removeChild(img);
      });

      imageElements.forEach((img) => {
        const width = img.getAttribute('width');
        const height = img.getAttribute('height');
        const x = img.getAttribute('x');
        const y = img.getAttribute('y');
        const newImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');

        newImg.setAttribute('x', x);
        newImg.setAttribute('y', y);
        newImg.setAttribute('width', width);
        newImg.setAttribute('height', height);
        newImg.setAttribute('href', img.getAttribute('href'));
        svg.appendChild(newImg);
      });

      const svgElement = new XMLSerializer().serializeToString(svg);
      return { ket2Molfile: reAttachPolymerList({ lines, atoms_count, extra_data_start, extra_data_end }), svgElement };
    }
  }));

  // helper function for output molfile re-structure
  const reAttachPolymerList = ({ lines, atoms_count, extra_data_start, extra_data_end }) => {
    const poly_identifier = "> <PolymersList>";
    let my_lines = [...lines];
    const atom_with_alias_list = [];
    let list_alias = my_lines.slice(extra_data_start, extra_data_end);
    const atom_starts = 4;
    for (let i = atom_starts; i < atoms_count + atom_starts; i++) {
      const atom_line = lines[i].split(" ");
      const idx = atom_line.indexOf(inspired_label);
      if (idx != -1) {
        atom_line[idx] = rails_polymer_identifier;
        console.log(i);
        atom_with_alias_list.push(`${i - atom_starts}`);
      }
      my_lines[i] = atom_line.join(" ");
    }
    my_lines.splice(extra_data_start, extra_data_end - extra_data_start);
    let counter = 0;

    for (let i = 1; i < list_alias.length; i += 2) {
      const t_id = list_alias[i].split("    ")[0].split("_")[1];
      if (t_id) {
        atom_with_alias_list[counter] += t_id == '02' ? "s" : "";
        counter++;
      }
    }
    my_lines.splice(my_lines.length - 1, 0, ...[poly_identifier, atom_with_alias_list.join(" "), "$$$$"]);
    return my_lines.join("\n");
  };

  return (
    <div>
      <iframe
        ref={iframeRef}
        id={editor.id}
        src={editor.extSrc}
        title={editor.label}
        height={iH}
        width="100%"
        style={iS}
      />
    </div>
  );
});

KetcherEditor.propTypes = {
  molfile: PropTypes.string,
  editor: PropTypes.object.isRequired,
  iH: PropTypes.string.isRequired,
  iS: PropTypes.object.isRequired,
};

export default KetcherEditor;

