/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ButtonToolbar,
  Modal,
  Panel,
  ControlLabel,
} from 'react-bootstrap';
import Select from 'react-select';
import NotificationActions from 'src/stores/alt/actions/NotificationActions';
import UserStore from 'src/stores/alt/stores/UserStore';
import UIStore from 'src/stores/alt/stores/UIStore';
import StructureEditor from 'src/models/StructureEditor';
import EditorAttrs from 'src/components/structureEditor/StructureEditorSet';
import ChemDrawEditor from 'src/components/structureEditor/ChemDrawEditor';
import MarvinjsEditor from 'src/components/structureEditor/MarvinjsEditor';
import KetcherEditor from 'src/components/structureEditor/KetcherEditor';
import loadScripts from 'src/components/structureEditor/loadScripts';
import UsersFetcher from 'src/fetchers/UsersFetcher';
import ProfilesFetcher from '../../fetchers/ProfilesFetcher';

const DEFAULT_EDITOR_KETCHER2 = 'ketcher2';
const notifyError = (message) => {
  NotificationActions.add({
    title: 'Structure Editor error',
    message,
    level: 'error',
    position: 'tc',
    dismissible: 'button',
    autoDismiss: 10,
  });
};
const key = 'ketcher-tmpls';

const loadEditor = (editor, scripts) => {
  if (scripts?.length > 0) {
    loadScripts({
      es: scripts,
      id: editor,
      cbError: () =>
        notifyError(
          `The ${editor} failed to initialize! Please contact your system administrator!`
        ),
      cbLoaded: () => {},
    });
  }
};

const createEditorInstance = (editor, available, configs) => ({
  [editor]: new StructureEditor({
    ...EditorAttrs[editor],
    ...available,
    ...configs,
    id: editor,
  }),
});

const createEditor = (configs, availableEditors) => {
  if (!availableEditors) return null;
  const available = availableEditors[configs.editor];
  if (available) {
    loadEditor(configs.editor, available.extJs);
    return createEditorInstance(configs.editor, available, configs);
  }
  return null;
};

const createEditors = (_state = {}) => {
  const matriceConfigs =
    _state.matriceConfigs || UserStore.getState().matriceConfigs || [];
  const availableEditors = UIStore.getState().structureEditors || {};
  const grantEditors = matriceConfigs
    .map(({ configs }) => createEditor(configs, availableEditors.editors))
    .filter(Boolean);

  const editors = [
    {
      ketcher: new StructureEditor({
        ...EditorAttrs.ketcher,
        id: 'ketcher',
      }),
    },
    ...grantEditors,
  ].reduce((acc, args) => ({ ...acc, ...args }), {});
  return editors;
};

function Editor({ type, editor, molfile, iframeHeight, iframeStyle, fnCb }) {
  switch (type) {
    case 'ketcher2':
      return (
        <KetcherEditor
          editor={editor}
          molfile={molfile}
          iH={iframeHeight}
          iS={iframeStyle}
        />
      );
    case 'chemdraw':
      return (
        <ChemDrawEditor
          editor={editor}
          molfile={molfile}
          iH={iframeHeight}
          fnCb={fnCb}
        />
      );
    case 'marvinjs':
      return (
        <MarvinjsEditor
          editor={editor}
          molfile={molfile}
          iH={iframeHeight}
          fnCb={fnCb}
        />
      );
    default:
      return (
        <div>
          <iframe
            id={editor.id}
            src={editor.src}
            title={`${editor.label}`}
            height={iframeHeight}
            width="100%"
            style={iframeStyle}
          />
        </div>
      );
  }
}

Editor.propTypes = {
  type: PropTypes.string.isRequired,
  editor: PropTypes.object.isRequired,
  molfile: PropTypes.string.isRequired,
  iframeHeight: PropTypes.string.isRequired,
  iframeStyle: PropTypes.object.isRequired,
  fnCb: PropTypes.func.isRequired,
};

function EditorList(props) {
  const { options, fnChange, value } = props;

  return (
    <div>
      <div className="col-lg-2">
        <ControlLabel>Structure Editor</ControlLabel>
      </div>

      <div className="col-lg-6 col-md-8">
        <Select
          className="status-select"
          name="editor selection"
          clearable={false}
          options={options}
          onChange={fnChange}
          value={value}
        />
      </div>
    </div>
  );
}

EditorList.propTypes = {
  value: PropTypes.string.isRequired,
  fnChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function WarningBox({ handleCancelBtn, hideWarning, show }) {
  return show ? (
    <Panel bsStyle="info">
      <Panel.Heading>
        <Panel.Title>Parents/Descendants will not be changed!</Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        <p>
          This sample has parents or descendants, and they will not be changed.
        </p>
        <p>Are you sure?</p>
        <br />
        <Button
          bsStyle="danger"
          onClick={handleCancelBtn}
          className="g-marginLeft--10"
        >
          Cancel
        </Button>
        <Button
          bsStyle="warning"
          onClick={hideWarning}
          className="g-marginLeft--10"
        >
          Continue Editing
        </Button>
      </Panel.Body>
    </Panel>
  ) : null;
}

WarningBox.propTypes = {
  handleCancelBtn: PropTypes.func.isRequired,
  hideWarning: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

const initEditor = () => {
  const userProfile = UserStore.getState().profile;
  const eId = userProfile?.data?.default_structure_editor || 'ketcher';
  const editor = new StructureEditor({ ...EditorAttrs[eId], id: eId });
  return editor;
};

export default class StructureEditorModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: props.showModal,
      showWarning: props.hasChildren || props.hasParent || false,
      molfile: props.molfile,
      matriceConfigs: [],
      editor: initEditor(),
      copyOfLocalStorage: JSON.parse(localStorage.getItem(key)) || [],
      deleteAllowed: true,
    };
    this.editors = createEditors();
    this.handleEditorSelection = this.handleEditorSelection.bind(this);
    this.resetEditor = this.resetEditor.bind(this);
    this.updateEditor = this.updateEditor.bind(this);
  }

  componentDidMount() {
    this.resetEditor(this.editors);
    this.setDefaultEditorForce();
    this.localStorageEventListener();
  }

  componentDidUpdate(prevProps) {
    const { showModal, molfile } = this.props;
    if (prevProps.showModal !== showModal || prevProps.molfile !== molfile) {
      this.setState({ showModal, molfile });
    }
  }

  setDefaultEditorForce() {
    if (this.editors[DEFAULT_EDITOR_KETCHER2]) {
      this.setState({ editor: this.editors[DEFAULT_EDITOR_KETCHER2] });
    }
  }

  async deleteAndStoreItemAgain(item) {
    const res = await ProfilesFetcher.uploadUserTemplates({
      content: JSON.stringify(item),
    });
    const attachment_id = res?.template_details?.attachment_data?.id;
    await UsersFetcher.updateUserProfile({
      user_templates: attachment_id,
    }).catch((err) => console.log('ISSUE WITH create'));
  }

  localStorageEventListener() {
    window.addEventListener(
      'storage',
      async (event) => {
        let { newValue, oldValue } = event;
        newValue = JSON.parse(newValue);
        oldValue = JSON.parse(oldValue);
        const { deleteAllowed } = this.state;

        if (event.key === key && deleteAllowed) {

          if (newValue.length > oldValue.length) {
            let newItem = newValue[newValue.length - 1];
            const res = await ProfilesFetcher.uploadUserTemplates({
              content: JSON.stringify(newItem),
            });

            const attachment_id = res?.template_details?.attachment_data?.id;
            newItem.props.path = attachment_id;
            newValue[newValue.length - 1] = newItem;
            localStorage.setItem(key, JSON.stringify(newValue));
            this.setState({ deleteAllowed: false });

            // udpate user profile
            await UsersFetcher.updateUserProfile({
              user_templates: attachment_id,
            });
          } else if (newValue.length < oldValue.length) {
            // delete
            const listOfLocalid = newValue.map((item) => item.props.path);
            for (let i = 0; i < oldValue.length; i++) {
              const localItem = oldValue[i];
              const itemIndexShouldBeRemoved = listOfLocalid.indexOf(
                localItem.props.path
              );
              if (itemIndexShouldBeRemoved == -1) {
                await ProfilesFetcher.deleteUserTemplate({
                  path: localItem?.props.path,
                });
                break;
              }
            }
          } else if (newValue.length == oldValue.length) {
            const listOfLocalNames = newValue.map(
              (item) => JSON.parse(item.struct).header.moleculeName
            );

            for (let i = 0; i < oldValue.length; i++) {
              const localItem = JSON.parse(oldValue[i].struct);

              const itemIndexShouldBeRemoved = listOfLocalNames.indexOf(
                localItem.header.moleculeName
              );

              if (itemIndexShouldBeRemoved == -1) {
                await ProfilesFetcher.deleteUserTemplate({
                  path: newValue[i].props.path,
                }).catch((err) =>
                  console.log('ISSUE WITH DELETE', localItem?.props?.path)
                );
                this.deleteAndStoreItemAgain(newValue[i]);
                break;
              } else {
                console.log('INDEX NOT FOUND@');
              }
            }
          }
        } else {
          this.setState({ deleteAllowed: true });
        }
      },
      false
    );
  }

  handleEditorSelection(e) {
    this.setState((prevState) => ({
      ...prevState,
      editor: this.editors[e.value],
    }));
  }

  handleCancelBtn() {
    const { onCancel } = this.props;
    this.hideModal();
    if (onCancel) {
      onCancel();
    }
  }

  handleSaveBtn() {
    const { editor } = this.state;
    const structure = editor.structureDef;
    if (editor.id === 'marvinjs') {
      structure.editor.sketcherInstance.exportStructure('mol').then(
        (mMol) => {
          const editorImg = new structure.editor.ImageExporter({
            imageType: 'image/svg',
          });
          editorImg.render(mMol).then(
            (svg) => {
              this.setState(
                {
                  showModal: false,
                  showWarning: this.props.hasChildren || this.props.hasParent,
                },
                () => {
                  if (this.props.onSave) {
                    this.props.onSave(mMol, svg, null, editor.id);
                  }
                }
              );
            },
            (error) => {
              alert(`MarvinJS image generated fail: ${error}`);
            }
          );
        },
        (error) => {
          alert(`MarvinJS molfile generated fail: ${error}`);
        }
      );
    } else if (editor.id === 'ketcher2') {
      structure.editor.getMolfile().then((molfile) => {
        structure.editor
          .generateImage(molfile, { outputFormat: 'svg' })
          .then((imgfile) => {
            imgfile.text().then((text) => {
              this.setState(
                {
                  showModal: false,
                  showWarning: this.props.hasChildren || this.props.hasParent,
                },
                () => {
                  if (this.props.onSave) {
                    this.props.onSave(molfile, text, { smiles: '' }, editor.id);
                  }
                }
              );
            });
          });
      });
    } else {
      try {
        const { molfile, info } = structure;
        if (!molfile) throw new Error('No molfile');
        structure.fetchSVG().then((svg) => {
          this.setState(
            {
              showModal: false,
              showWarning: this.props.hasChildren || this.props.hasParent,
            },
            () => {
              if (this.props.onSave) {
                this.props.onSave(molfile, svg, info, editor.id);
              }
            }
          );
        });
      } catch (e) {
        notifyError(`The drawing is not supported! ${e}`);
      }
    }
  }

  initializeEditor() {
    const { editor, molfile } = this.state;
    if (editor) {
      editor.structureDef.molfile = molfile;
    }
  }

  resetEditor(_editors) {
    const kks = Object.keys(_editors);
    const { editor } = this.state;
    if (!kks.find((e) => e === editor.id)) {
      this.setState({
        editor: new StructureEditor({ ...EditorAttrs.ketcher, id: 'ketcher' }),
      });
    }
  }

  updateEditor(_editor) {
    this.setState({ editor: _editor });
  }

  hideModal() {
    const { hasChildren, hasParent } = this.props;
    this.setState({
      showModal: false,
      showWarning: hasChildren || hasParent,
    });
  }

  hideWarning() {
    this.setState({ showWarning: false });
  }

  render() {
    const handleSaveBtn = !this.props.onSave
      ? null
      : this.handleSaveBtn.bind(this);
    const { cancelBtnText, submitBtnText } = this.props;
    const submitAddons = this.props.submitAddons ? this.props.submitAddons : '';
    const { editor, showWarning, molfile } = this.state;
    const iframeHeight = showWarning ? '0px' : '630px';
    const iframeStyle = showWarning ? { border: 'none' } : {};
    const buttonToolStyle = showWarning
      ? { marginTop: '20px', display: 'none' }
      : { marginTop: '20px' };

    let useEditor = (
      <div>
        <iframe
          id={editor.id}
          src={editor.src}
          title={`${editor.label}`}
          height={iframeHeight}
          width="100%"
          style={iframeStyle}
        />
      </div>
    );
    useEditor = !showWarning && this.editors[editor.id] && (
      <Editor
        type={editor.id}
        editor={this.editors[editor.id]}
        molfile={molfile}
        iframeHeight={iframeHeight}
        iframeStyle={iframeStyle}
        fnCb={this.updateEditor}
      />
    );
    const editorOptions = Object.keys(this.editors).map((e) => ({
      value: e,
      name: this.editors[e].label,
      label: this.editors[e].label,
    }));
    return (
      <div>
        <Modal
          dialogClassName={
            this.state.showWarning ? '' : 'structure-editor-modal'
          }
          animation
          show={this.state.showModal}
          onLoad={this.initializeEditor.bind(this)}
          onHide={this.handleCancelBtn.bind(this)}
        >
          <Modal.Header closeButton>
            {/* <Modal.Title> */}
            <EditorList
              value={editor.id}
              fnChange={this.handleEditorSelection}
              options={editorOptions}
            />
            {/* </Modal.Title> */}
          </Modal.Header>
          <Modal.Body>
            <WarningBox
              handleCancelBtn={this.handleCancelBtn.bind(this)}
              hideWarning={this.hideWarning.bind(this)}
              show={!!showWarning}
            />
            {useEditor}
            <div style={buttonToolStyle}>
              <ButtonToolbar>
                <Button
                  bsStyle="warning"
                  onClick={this.handleCancelBtn.bind(this)}
                >
                  {cancelBtnText}
                </Button>
                {!handleSaveBtn ? null : (
                  <Button
                    bsStyle="primary"
                    onClick={handleSaveBtn}
                    style={{ marginRight: '20px' }}
                  >
                    {submitBtnText}
                  </Button>
                )}
                {!handleSaveBtn ? null : submitAddons}
              </ButtonToolbar>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

StructureEditorModal.propTypes = {
  molfile: PropTypes.string,
  showModal: PropTypes.bool,
  hasChildren: PropTypes.bool,
  hasParent: PropTypes.bool,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  submitBtnText: PropTypes.string,
  cancelBtnText: PropTypes.string,
};

StructureEditorModal.defaultProps = {
  molfile: '\n  noname\n\n  0  0  0  0  0  0  0  0  0  0999 V2000\nM  END\n',
  showModal: false,
  hasChildren: false,
  hasParent: false,
  onCancel: () => {},
  onSave: () => {},
  submitBtnText: 'Save',
  cancelBtnText: 'Cancel',
};
