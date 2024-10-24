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

  // methods
  hasKetcherData,
  adding_polymers_ketcher_format,
  adding_polymers_indigo_molfile,
  checkAliasMatch,
  prepareImageFromTemplateList,
  resetOtherAliasCounters,

  // DOM Methods
  disableButton,
  attachListenerForTitle,
  updateImagesInTheCanvas,
  updateTemplatesInTheCanvas,

  // setters
  images_to_be_updated_setter
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

const KetcherEditor = forwardRef((props, ref) => {
  const { editor, iH, iS, molfile } = props;
  const iframeRef = useRef();
  let initMol = molfile || '\n  noname\n\n  0  0  0  0  0  0  0  0  0  0999 V2000\nM  END\n';

  // helper function to rebase with the ketcher canvas data
  const fuelKetcherData = async (data) => {
    all_atoms = [];
    latestData = data ? JSON.parse(await editor.structureDef.editor.getKet(data)) : JSON.parse(await editor.structureDef.editor.getKet());
    allNodes = [...latestData.root.nodes];
    imagesList = allNodes.length > mols.length ? allNodes.filter(
      item => item.type === 'image'
    ) : imagesList;
    mols = allNodes.slice(0, allNodes.length - imagesList.length).map(i => i.$ref);
    mols.forEach((item) => latestData[item]?.atoms.map(i => all_atoms.push(i)));
    // console.log("DATA FUELED", { image_used_counter, latestData, allNodes, imagesList, mols, decision: allNodes.length > mols.length });
  };

  // enable editor change listener
  const onEditorChange = (editor) => {
    editor._structureDef.editor.editor.subscribe('change', async (eventData) => {
      const result = await eventData;
      handleEventCapture(result);
    });
  };

  // Load the editor content and set up the molecule
  const loadContent = async (event) => {
    if (event.data.eventType === 'init') {
      window.editor = editor;
      await hasKetcherData(initMol, async ({ struct, rails_polymers_list }) => {
        await editor.structureDef.editor.setMolecule(struct); // set initial
        await setKetcherData({ rails_polymers_list }); // process polymers
        onEditorChange(editor); // subscribe to editor change
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
      const { c_images: collected_images, molfileData } = adding_polymers_indigo_molfile();
      latestData = { ...molfileData };
      collected_images = c_images;
    }
    latestData.root.nodes.push(...collected_images);
    await editor.structureDef.editor.setMolecule(JSON.stringify(latestData));
    await fuelKetcherData();
    await moveTemplate();
  };

  // main funcation to capture all events from editor
  const handleEventCapture = async (data) => {
    let allowed_to_process = true;
    const selection = editor._structureDef.editor.editor._selection;
    if (selection?.images) {
      addEventToFILOStack("Move image");
    }

    for (const eventItem of data) {
      switch (eventItem?.operation) {
        case "Load canvas":
          await fuelKetcherData();
          if (re_render_canvas)
            await moveTemplate();
          break;
        case "Move image":
          addEventToFILOStack("Move image");
          break;
        case "Set atom attribute":
        case "Add atom":
          if (two_parts_pattern.test(eventItem.to) || eventItem.label == "A") {
            new_atoms.push(eventItem);
          }
          addEventToFILOStack("Add atom");
          break;
        case "Upsert image":
          addEventToFILOStack("Upsert image");
          break;
        case "Move atom":
          const { exists } = should_canvas_update_on_movement(eventItem);
          allowed_to_process = exists;
          addEventToFILOStack("Move atom");
          break;
        case "Delete image":
          console.log("delete image");
          // await editor._structureDef.editor.editor.undo();
          break;
        case 'Delete atom': {
          console.log("DELETE ATOM!!");
          const { atom } = should_canvas_update_on_movement(eventItem);
          if (eventItem.label == "A") atoms_to_be_deleted.push(atom);
        } break;
        case 'Update': {
          // console.log({ Update: eventItem });
        } break;
        default:
          // console.warn("Unhandled operation:", eventItem.operation);
          break;
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
      switch (event) {
        case "Load canvas":
          // nothing happens because it can lead to infinite canvas render
          break;
        case "Move image":
        case "Move atom":
          moveTemplate();
          break;
        case "Add atom":
          handleAddAtom();
          break;
        case "Upsert image":
          // postAtomAddImageInsertion();
          break;
        case "Delete image":
          break;
        default:
          console.log("I'm default");
          // console.warn("Unhandled event:", event);
          break;
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

    let atom_id_counter = -1;
    let new_images = [];
    const all_three_alias_collection = new Set();

    for (let m = 0; m < mols.length; m++) {
      const mol = latestData[mols[m]];
      const is_h_id_list = [];
      for (let a = 0; a < mol.atoms.length; a++) {
        const atom = mol.atoms[a];
        atom_id_counter++;
        const splits = atom?.alias?.split("_");

        // label A with three part alias
        if (atom.label === "A" && three_parts_patten.test(atom.alias) && splits.length == 3) {
          // console.warn({ three: splits, all_three_alias_collection, all_three_alias_collection });
          if (checkAliasMatch(atom.alias, all_three_alias_collection)) {
            console.log("EXISTS");
            ++image_used_counter;
            atom.alias = `t_${splits[1]}_${image_used_counter}`;
            // console.log("THREE", { imagesList }, imagesList.length - 1, image_used_counter);
            if (imagesList.length - 1 < image_used_counter) {
              console.log("neu bild ist gebraucht.");
              const img = prepareImageFromTemplateList(parseInt(splits[1]), atom.location);
              new_images.push(img);
            }
          } else {
            if (image_used_counter === -1 && !imagesList.length) {
              const img = prepareImageFromTemplateList(parseInt(splits[1]), atom.location);
              new_images.push(img);
              image_used_counter++;
            }
          }
          all_three_alias_collection.add(atom.alias);
        }
        // label A with two part alias n
        else if (atom.label === "A" && two_parts_pattern.test(atom.alias) && splits.length == 2) {
          console.warn({ two: splits, atom, all_three_alias_collection });
          atom.alias += `_${++image_used_counter}`;
          console.log("TWO", { imagesList }, imagesList.length - 1, image_used_counter);
          if (imagesList.length - 1 < image_used_counter) {
            const img = prepareImageFromTemplateList(parseInt(splits[1]), atom.location);
            new_images.push(img);
          }
          all_three_alias_collection.add(atom.alias);
        }
        else if (atom.label === "H") is_h_id_list.push(atom);
        else {
          console.error("dead zone!!");
        }
      }
      if (is_h_id_list.length) {
        mol.atoms?.splice(mol.atoms.length - is_h_id_list.length, is_h_id_list.length);
        mol.bonds?.splice(mol.bonds.length - is_h_id_list.length, is_h_id_list.length);
      }
    }
    const d = { ...latestData };
    d.root.nodes = [...d.root.nodes, ...new_images];
    new_atoms = [];
    await editor.structureDef.editor.setMolecule(JSON.stringify(latestData));
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
        // pattern identify
      },
      "[title='Redo \\(Ctrl\\+Shift\\+Z\\)']": () => {
        // pattern identify
      },
      'Erase \\(Del\\)': () => {
        // pattern identify
      }
    };

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
        pathObserver.disconnect(); // Disconnect the path observer
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

  useEffect(() => {
    resetStore();
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', attachClickListeners);
    }
    window.addEventListener('message', loadContent);

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', attachClickListeners);
      }
      window.removeEventListener('message', loadContent);
    };
  }, []);

  // ref functions when a canvas is saved using main "SAVE" button
  useImperativeHandle(ref, () => ({
    getData: () => {
      return "hallo";
    },
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

  const reAttachPolymerList = ({ lines, atoms_count, extra_data_start, extra_data_end }) => {
    const ploy_identifier = "> <PolymersList>";
    let my_lines = [...lines];
    const atom_with_alias_list = [];
    let list_alias = my_lines.slice(extra_data_start, extra_data_end);
    const atom_starts = 4;
    for (let i = atom_starts; i < atoms_count + atom_starts; i++) {
      const atom_line = lines[i].split(" ");
      const idx = atom_line.indexOf("A");
      if (idx != -1) {
        atom_line[idx] = "R#";
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
    my_lines.splice(my_lines.length - 1, 0, ...[ploy_identifier, atom_with_alias_list.join(" "), "$$$$"]);
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

