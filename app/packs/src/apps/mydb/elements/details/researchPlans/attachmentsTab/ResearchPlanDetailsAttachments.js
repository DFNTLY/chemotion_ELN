/* eslint-disable react/destructuring-assignment */
import Dropzone from 'react-dropzone';
import EditorFetcher from 'src/fetchers/EditorFetcher';
import ElementActions from 'src/stores/alt/actions/ElementActions';
import ImageModal from 'src/components/common/ImageModal';
import LoadingActions from 'src/stores/alt/actions/LoadingActions';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SpinnerPencilIcon from 'src/components/common/SpinnerPencilIcon';
import ImageAnnotationModalSVG from 'src/apps/mydb/elements/details/researchPlans/ImageAnnotationModalSVG';
import ImageAnnotationEditButton from 'src/apps/mydb/elements/details/researchPlans/ImageAnnotationEditButton';
import Utils from 'src/utilities/Functions';
import {
  Button, ButtonGroup, Glyphicon, Overlay, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import { last, findKey, values } from 'lodash';
import AttachmentFetcher from 'src/fetchers/AttachmentFetcher';
import ImageAttachmentFilter from 'src/utilities/ImageAttachmentFilter';
import SaveResearchPlanWarning from 'src/apps/mydb/elements/details/researchPlans/SaveResearchPlanWarning';

const editorTooltip = (exts) => (
  <Tooltip id="editor_tooltip">
    Available extensions:&nbsp;
    {exts}
  </Tooltip>
);
const downloadTooltip = <Tooltip id="download_tooltip">Download original attachment</Tooltip>;
const downloadAnnotationTooltip = <Tooltip id="download_tooltip">Download annotated attachment</Tooltip>;

export default class ResearchPlanDetailsAttachments extends Component {
  static isImageFile(fileName) {
    const acceptedImageTypes = ['png', 'jpg', 'bmp', 'tif', 'svg', 'jpeg', 'tiff'];
    const dataType = last(fileName.split('.'));
    return acceptedImageTypes.includes(dataType);
  }

  static renderDownloadAnnotatedImageButton(attachment) {
    if (!ResearchPlanDetailsAttachments.isImageFile(attachment.filename)) {
      return null;
    }
    return (
      <OverlayTrigger placement="top" overlay={downloadAnnotationTooltip}>
        <div>
          <Button
            bsSize="xsmall"
            style={{ width: '25px', height: '25px' }}
            className="button-right"
            bsStyle="primary"
            disabled={attachment.isNew}
            onClick={() => {
              Utils.downloadFile({
                contents: `/api/v1/attachments/${attachment.id}/annotated_image`,
                name: attachment.filename
              });
            }}
          >
            <i className="fa fa-download" aria-hidden="true" />
          </Button>
        </div>
      </OverlayTrigger>
    );
  }

  constructor(props) {
    super(props);
    this.importButtonRefs = [];

    this.state = {
      attachmentEditor: false,
      extension: null,
      imageEditModalShown: false,
      showImportConfirm: [],
      filteredAttachments: [...props.attachments],
      filterText: '',
      sortBy: 'name'
    };
    this.editorInitial = this.editorInitial.bind(this);
    this.createAttachmentPreviews = this.createAttachmentPreviews.bind(this);
  }

  componentDidMount() {
    this.editorInitial();
    this.createAttachmentPreviews();
  }

  componentDidUpdate(prevProps) {
    const { attachments } = this.props;
    if (attachments !== prevProps.attachments) {
      this.createAttachmentPreviews();
    }
    if (prevProps.attachments !== this.props.attachments) {
      this.setState({ filteredAttachments: [...this.props.attachments] }, this.filterAndSortAttachments);
    }
  }

  /* eslint-disable no-param-reassign */
  handleEdit(attachment) {
    const fileType = last(attachment.filename.split('.'));
    const docType = this.documentType(attachment.filename);

    EditorFetcher.startEditing({ attachment_id: attachment.id })
      .then((result) => {
        if (result.token) {
          const url = `/editor?id=${attachment.id}&docType=${docType}
          &fileType=${fileType}&title=${attachment.filename}&key=${result.token}
          &only_office_token=${result.only_office_token}`;
          window.open(url, '_blank');

          attachment.aasm_state = 'oo_editing';
          attachment.updated_at = new Date();

          this.props.onEdit(attachment);
        } else {
          alert('Unauthorized to edit this file.');
        }
      });
  }
  /* eslint-enable no-param-reassign */

  onImport(attachment) {
    const { researchPlan, onAttachmentImportComplete } = this.props;
    const researchPlanId = researchPlan.id;
    LoadingActions.start();
    ElementActions.importTableFromSpreadsheet(
      researchPlanId,
      attachment.id,
      onAttachmentImportComplete
    );
    LoadingActions.stop();
  }

  handleFilterChange = (e) => {
    this.setState({ filterText: e.target.value }, this.filterAndSortAttachments);
  };

  handleSortChange = (e) => {
    this.setState({ sortBy: e.target.value }, this.filterAndSortAttachments);
  };

  toggleSortDirection = () => {
    this.setState((prevState) => ({
      sortDirection: prevState.sortDirection === 'asc' ? 'desc' : 'asc'
    }), this.filterAndSortAttachments);
  };

  filterAndSortAttachments() {
    const { filterText, sortBy } = this.state;

    const filter = new ImageAttachmentFilter();
    let filteredAttachments = filter.filterAttachmentsWhichAreInBody(
      this.props.researchPlan.body,
      this.props.attachments
    );

    filteredAttachments = filteredAttachments.filter(
      (attachment) => attachment.filename.toLowerCase().includes(filterText.toLowerCase())
    );

    filteredAttachments.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.filesize - b.filesize;
          break;
        default:
          break;
      }
      return this.state.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.setState({ filteredAttachments });
  }

  /* eslint-disable no-param-reassign */
  createAttachmentPreviews() {
    const { attachments } = this.props;
    attachments.map((attachment) => {
      if (attachment.thumb) {
        AttachmentFetcher.fetchThumbnail({ id: attachment.id }).then(
          (result) => {
            if (result != null) {
              attachment.preview = `data:image/png;base64,${result}`;
              this.forceUpdate();
            }
          }
        );
      } else {
        attachment.preview = '/images/wild_card/not_available.svg';
        this.forceUpdate();
      }
      return attachment;
    });
  }
  /* eslint-enable no-param-reassign */

  documentType(filename) {
    const { extension } = this.state;

    const ext = last(filename.split('.'));
    const docType = findKey(extension, (o) => o.includes(ext));

    if (typeof docType === 'undefined' || !docType) {
      return null;
    }

    return docType;
  }

  editorInitial() {
    EditorFetcher.initial().then((result) => {
      this.setState({
        attachmentEditor: result.installed,
        extension: result.ext,
      });
    });
  }

  showImportConfirm(attachmentId) {
    const { showImportConfirm } = this.state;
    showImportConfirm[attachmentId] = true;
    this.setState({ showImportConfirm });
  }

  hideImportConfirm(attachmentId) {
    const { showImportConfirm } = this.state;
    showImportConfirm[attachmentId] = false;
    this.setState({ showImportConfirm });
  }

  confirmAttachmentImport(attachment) {
    this.onImport(attachment);
    this.hideImportConfirm(attachment.id);
  }

  renderRemoveAttachmentButton(attachment) {
    const { onDelete, readOnly } = this.props;
    return (
      <OverlayTrigger placement="top" overlay={<Tooltip id="delete_tooltip">Delete attachment</Tooltip>}>
        <Button
          bsSize="xsmall"
          bsStyle="danger"
          style={{ width: '25px', height: '25px' }}
          className="button-right"
          onClick={() => onDelete(attachment)}
          disabled={readOnly}
        >
          <i className="fa fa-trash-o" aria-hidden="true" />
        </Button>
      </OverlayTrigger>
    );
  }

  renderImageEditModal() {
    const { choosenAttachment, imageEditModalShown } = this.state;
    const { onEdit } = this.props;
    return (
      <ImageAnnotationModalSVG
        attachment={choosenAttachment}
        isShow={imageEditModalShown}
        handleSave={
          () => {
            const newAnnotation = document.getElementById('svgEditId').contentWindow.svgEditor.svgCanvas.getSvgString();
            choosenAttachment.updatedAnnotation = newAnnotation;
            this.setState({ imageEditModalShown: false });
            onEdit(choosenAttachment);
          }
        }
        handleOnClose={() => { this.setState({ imageEditModalShown: false }); }}
      />
    );
  }

  renderAnnotateImageButton(attachment) {
    return (
      <ImageAnnotationEditButton
        parent={this}
        attachment={attachment}
        horizontalAlignment="button-right"
        style={{ width: '25px', height: '25px' }}
      />
    );
  }

  renderActions(attachment) {
    const { attachmentEditor, extension } = this.state;
    const { onUndoDelete } = this.props;

    const updateTime = new Date(attachment.updated_at);
    updateTime.setTime(updateTime.getTime() + 15 * 60 * 1000);

    const isEditing = attachment.aasm_state === 'oo_editing'
      && new Date().getTime() < updateTime;

    const docType = this.documentType(attachment.filename);
    const editDisable = !attachmentEditor || isEditing || attachment.is_new || docType === null;
    const styleEditorBtn = !attachmentEditor || docType === null ? 'none' : '';
    const isAnnotationUpdated = attachment.updatedAnnotation;
    if (attachment.is_deleted) {
      return (
        <div>
          <Button
            bsSize="xsmall"
            bsStyle="danger"
            className="button-right"
            style={{ width: '25px', height: '25px' }}
            onClick={() => onUndoDelete(attachment)}
          >
            <i className="fa fa-undo" aria-hidden="true" />
          </Button>
        </div>
      );
    }

    return (
      <div>
        <SaveResearchPlanWarning visible={isAnnotationUpdated} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {this.renderRemoveAttachmentButton(attachment)}
          {this.renderDownloadOriginalButton(attachment)}
          {this.renderEditAttachmentButton(
            attachment,
            extension,
            attachmentEditor,
            isEditing,
            styleEditorBtn,
            styleEditorBtn,
            editDisable
          )}
          {ResearchPlanDetailsAttachments.renderDownloadAnnotatedImageButton(attachment)}
          {this.renderAnnotateImageButton(attachment)}
          {this.renderImportAttachmentButton(attachment)}
        </div>
      </div>
    );
  }

  renderEditAttachmentButton(attachment, extension, attachmentEditor, isEditing, styleEditorBtn, editDisable) {
    return (
      <OverlayTrigger placement="left" overlay={editorTooltip(values(extension).join(','))}>
        <Button
          style={{ display: styleEditorBtn, width: '25px', height: '25px' }}
          bsSize="xsmall"
          className="button-right"
          bsStyle="success"
          disabled={editDisable}
          onClick={() => this.handleEdit(attachment)}
        >

          <SpinnerPencilIcon spinningLock={!attachmentEditor || isEditing} />
        </Button>
      </OverlayTrigger>

    );
  }

  renderDownloadOriginalButton(attachment) {
    const { onDownload } = this.props;
    return (
      <OverlayTrigger placement="top" overlay={downloadTooltip}>
        <Button
          bsSize="xsmall"
          className="button-right"
          bsStyle="primary"
          style={{ width: '25px', height: '25px' }}
          onClick={() => onDownload(attachment)}
        >
          <i className="fa fa-download" aria-hidden="true" />
        </Button>
      </OverlayTrigger>
    );
  }

  renderDropzone() {
    return (
      <Dropzone
        onDrop={this.props.onDrop}
        className="research-plan-dropzone"
        style={{
          width: '100%',
          padding: '20px',
          border: '2px dashed #cccccc',
          textAlign: 'center',
          marginBottom: '20px',
          borderRadius: '5px',
          backgroundColor: '#f7f7f7'
        }}
      >
        Drop files here, or click to upload.
      </Dropzone>

    );
  }

  renderSortingAndFilteringUI() {
    const commonStyle = {
      padding: '5px',
      borderRadius: '5px',
      border: '1px solid #ccc',
      height: '35px'
    };

    const sortIconStyle = {
      marginLeft: '10px',
      cursor: 'pointer',
      fontSize: '20px',
      color: '#000',
      borderRadius: '50%',
      padding: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.3s'
    };

    const isAscending = this.state.sortDirection === 'asc';

    return (
      <div style={{
        marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px' }}>Sort by: </label>
          <select
            onChange={this.handleSortChange}
            style={{ ...commonStyle, width: '100px' }}
          >
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
          <div onClick={this.toggleSortDirection} style={sortIconStyle}>
            {isAscending ? '▲' : '▼'}
          </div>
        </div>
        <div>
          <label style={{ marginRight: '10px' }}>Filter: </label>
          <input
            type="text"
            placeholder="Filter by name..."
            onChange={this.handleFilterChange}
            style={{ ...commonStyle, width: '250px' }}
          />
        </div>
      </div>
    );
  }

  renderAttachmentRow(attachment) {
    const maxCharsWithoutTooltip = 50;

    const renderTooltip = (
      <OverlayTrigger
        placement="top"
        overlay={(
          <Tooltip id={`tooltip-${attachment.id}`}>
            {attachment.filename}
          </Tooltip>
      )}
      >
        <div style={{
          flex: '0.5',
          marginLeft: '20px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: '#333',
        }}
        >
          {attachment.filename}
        </div>
      </OverlayTrigger>
    );

    const renderText = (
      <div style={{
        flex: '0.5',
        marginLeft: '20px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        color: '#333',
      }}
      >
        {attachment.filename}
      </div>
    );

    const formatFileSize = (sizeInKB) => {
      if (sizeInKB >= 1024) {
        return `${(sizeInKB / 1024).toFixed(2)} MB`;
      }
      return `${sizeInKB} KB`;
    };

    const fetchNeeded = false;
    const hasPop = false;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.3s ease',
      }}
      >
        <div style={{
          flex: '0.1',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        >
          <ImageModal
            imageStyle={{
              width: '60px',
              height: '60px',
              borderRadius: '5px',
              objectFit: 'cover',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            }}
            hasPop={hasPop}
            alt="thumbnail"
            previewObject={{
              src: attachment.preview,
            }}
            popObject={{
              title: attachment.filename,
              src: attachment.preview,
              fetchNeeded,
              fetchId: attachment.id,
            }}
          />
        </div>

        {attachment.filename.length > maxCharsWithoutTooltip ? renderTooltip : renderText}

        <div style={{
          flex: '0.2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#777',
          marginLeft: '10px',
        }}
        >
          <span>
            Size:&nbsp;
            <span style={{ fontWeight: 'bold', color: '#444' }}>
              {formatFileSize(attachment.filesize)}
            </span>
          </span>

        </div>

        <div style={{ flex: '0.3', display: 'flex', justifyContent: 'flex-end' }}>
          {this.renderActions(attachment)}
        </div>
      </div>
    );
  }

  renderImportAttachmentButton(attachment) {
    const { showImportConfirm } = this.state;
    const { researchPlan } = this.props;
    const show = showImportConfirm[attachment.id];
    // TODO: import disabled when?
    const importDisabled = researchPlan.changed;
    const extension = last(attachment.filename.split('.'));

    const importTooltip = importDisabled
      ? <Tooltip id="import_tooltip">Research Plan must be saved before import</Tooltip>
      : <Tooltip id="import_tooltip">Import spreadsheet as research plan table</Tooltip>;

    const confirmTooltip = (
      <Tooltip placement="bottom" className="in" id="tooltip-bottom">
        Import data from Spreadsheet?
        <br />
        <ButtonGroup>
          <Button
            bsStyle="success"
            bsSize="xsmall"
            onClick={() => this.confirmAttachmentImport(attachment)}
          >
            Yes
          </Button>
          <Button
            bsStyle="warning"
            bsSize="xsmall"
            onClick={() => this.hideImportConfirm(attachment.id)}
          >
            No
          </Button>
        </ButtonGroup>
      </Tooltip>
    );

    if (extension === 'xlsx') {
      return (
        <div>
          <OverlayTrigger placement="top" overlay={importTooltip}>
            <div style={{ float: 'right' }}>
              <Button
                bsSize="xsmall"
                bsStyle="success"
                className="button-right"
                disabled={importDisabled}
                ref={(ref) => {
                  this.importButtonRefs[attachment.id] = ref;
                }}
                style={{
                  ...(importDisabled ? { pointerEvents: 'none' } : {}),
                  width: '25px',
                  height: '25px'
                }}
                onClick={() => this.showImportConfirm(attachment.id)}
              >
                <Glyphicon glyph="import" />
              </Button>
            </div>
          </OverlayTrigger>
          <Overlay
            show={show}
            placement="bottom"
            rootClose
            onHide={() => this.hideImportConfirm(attachment.id)}
            target={this.importButtonRefs[attachment.id]}
          >
            {confirmTooltip}
          </Overlay>
        </div>
      );
    }
    return true;
  }

  render() {
    const { filteredAttachments } = this.state;

    return (
      <div style={{
        padding: '20px', backgroundColor: '#ffffff', borderRadius: '5px', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)'
      }}
      >
        {this.renderImageEditModal()}
        {this.renderDropzone()}
        {this.renderSortingAndFilteringUI()}

        {filteredAttachments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            fontSize: '16px',
            color: '#888',
          }}
          >
            There are currently no attachments.
          </div>
        ) : (
          filteredAttachments.map((attachment) => this.renderAttachmentRow(attachment))
        )}
      </div>
    );
  }
}

ResearchPlanDetailsAttachments.propTypes = {
  researchPlan: PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]).isRequired,
    changed: PropTypes.bool.isRequired,
    body: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
      })
    ).isRequired,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number
        ]).isRequired,
        aasm_state: PropTypes.string.isRequired,
        content_type: PropTypes.string.isRequired,
        filename: PropTypes.string.isRequired,
        filesize: PropTypes.number.isRequired,
        identifier: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number
        ]).isRequired,
        thumb: PropTypes.bool.isRequired
      })
    )
  }).isRequired,
  attachments: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]).isRequired,
    aasm_state: PropTypes.string.isRequired,
    content_type: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    filesize: PropTypes.number.isRequired,
    identifier: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]).isRequired,
    thumb: PropTypes.bool.isRequired
  })),
  onDrop: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUndoDelete: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  onAttachmentImportComplete: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired
};

ResearchPlanDetailsAttachments.defaultProps = {
  attachments: [],
  onAttachmentImportComplete: () => { }
};
