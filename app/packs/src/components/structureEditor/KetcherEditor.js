/* eslint-disable react/require-default-props */
/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import UsersFetcher from 'src/fetchers/UsersFetcher';

function KetcherEditor(props) {
  const iframeRef = useRef();
  const {
    editor, iH, iS, molfile
  } = props;

  const initMol = molfile
    || '\n  noname\n\n  0  0  0  0  0  0  0  0  0  0999 V2000\nM  END\n';

  const loadContent = (event) => {
    if (event.data.eventType === 'init') {
      editor.structureDef.editor.setMolecule(initMol);
      // const sub = editor.structureDef.editor.editor;
      // sub.subscribe("change", (item) => console.log({ change: item }));
      // sub.subscribe("message", (item) => console.log({ message: item }));
      // sub.subscribe("Add atom", (item) => console.log({ message: item }));
    }
  };

  const handleStorageChange = (event) => {
    if (event.key === 'ketcher-opts') {
      UsersFetcher.updateUserKetcher2Options(event.newValue);
    }
  };

  useEffect(() => {
    window.addEventListener('message', loadContent);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('message', loadContent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
}

KetcherEditor.propTypes = {
  molfile: PropTypes.string,
  editor: PropTypes.object.isRequired,
  iH: PropTypes.string.isRequired,
  iS: PropTypes.object.isRequired,
};

export default KetcherEditor;
