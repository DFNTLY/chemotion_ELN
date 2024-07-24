import React from 'react';
import {
  Button, OverlayTrigger, Tooltip, Dropdown, Overlay, ButtonGroup
} from 'react-bootstrap';
import ImageAnnotationEditButton from 'src/apps/mydb/elements/details/researchPlans/ImageAnnotationEditButton';
import { values } from 'lodash';
import SpinnerPencilIcon from 'src/components/common/SpinnerPencilIcon';
import Dropzone from 'react-dropzone';
import Utils from 'src/utilities/Functions';
import ImageModal from 'src/components/common/ImageModal';
import MenuItem from 'src/components/legacyBootstrap/MenuItem'
import Glyphicon from 'src/components/legacyBootstrap/Glyphicon'

export const attachmentThumbnail = (attachment) => (
  <div className="attachment-row-image">
    <ImageModal
      imageStyle={{
        width: '45px',
        height: '45px',
        borderRadius: '5px',
        backgroundColor: '#FFF',
        objectFit: 'contain',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      }}
      alt="thumbnail"
      previewObject={{
        src: attachment.preview,
      }}
      popObject
      disableClick
    />
    <div className="large-preview-modal">
      <ImageModal
        imageStyle={{
          width: '400px',
          height: '400px',
          borderRadius: '5px',
          backgroundColor: '#FFF',
          objectFit: 'contain',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        }}
        hasPop
        showPopImage
        alt="thumbnail"
        previewObject={{
          src: attachment.preview,
        }}
        popObject={
        attachment.filename && attachment.filename.toLowerCase().match(/\.(png|jpg|bmp|tif|svg|jpeg|tiff)$/)
          ? {
            fetchNeeded: true,
            src: `/api/v1/attachments/${attachment.id}/annotated_image`,
          }
          : {
            src: attachment.preview,
          }
        }
        disableClick
      />
    </div>
  </div>
);

const isImageFile = (fileName) => {
  const acceptedImageTypes = ['png', 'jpg', 'bmp', 'tif', 'svg', 'jpeg', 'tiff'];
  const dataType = fileName.split('.').pop().toLowerCase();
  return acceptedImageTypes.includes(dataType);
};

export const formatFileSize = (sizeInB) => {
  if (sizeInB >= 1024 * 1024) {
    return `${(sizeInB / (1024 * 1024)).toFixed(2)} MB`;
  } if (sizeInB >= 1024) {
    return `${(sizeInB / 1024).toFixed(1)} kB`;
  }
  return `${sizeInB} bytes`;
};

const handleDownloadAnnotated = (attachment) => {
  const isImage = isImageFile(attachment.filename);
  if (isImage && !attachment.isNew) {
    Utils.downloadFile({
      contents: `/api/v1/attachments/${attachment.id}/annotated_image`,
      name: attachment.filename
    });
  }
};

const handleDownloadOriginal = (attachment) => {
  Utils.downloadFile({
    contents: `/api/v1/attachments/${attachment.id}`,
    name: attachment.filename,
  });
};

export const downloadButton = (attachment) => (
  <Dropdown id={`dropdown-download-${attachment.id}`}>
    <Dropdown.Toggle style={{ height: '30px' }} size="sm" variant="primary">
      <i className="fa fa-download" aria-hidden="true" />
    </Dropdown.Toggle>
    <Dropdown.Menu>
      <Dropdown.Item eventKey="1" onClick={() => handleDownloadOriginal(attachment)}>
        Download Original
      </Dropdown.Item>
      <Dropdown.Item
        eventKey="2"
        onClick={() => handleDownloadAnnotated(attachment)}
        disabled={!isImageFile(attachment.filename) || attachment.isNew}
      >
        Download Annotated
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>
);

export const removeButton = (attachment, onDelete, readOnly) => (
  <OverlayTrigger placement="top" overlay={<Tooltip id="delete_tooltip">Delete attachment</Tooltip>}>
    <Button
      size="sm"
      variant="danger"
      className="attachment-button-size"
      onClick={() => onDelete(attachment)}
      disabled={readOnly}
    >
      <i className="fa fa-trash-o" aria-hidden="true" />
    </Button>
  </OverlayTrigger>
);

export const moveBackButton = (attachment, onBack, readOnly) => (
  <OverlayTrigger placement="top" overlay={<Tooltip id="back_tooltip">Move attachment back to inbox</Tooltip>}>
    <Button
      size="sm"
      variant="danger"
      className="attachment-button-size"
      onClick={() => onBack(attachment)}
      disabled={readOnly}
    >
      <i className="fa fa-backward" aria-hidden="true" />
    </Button>
  </OverlayTrigger>

);

export const annotateButton = (attachment, parent) => (
  <ImageAnnotationEditButton
    parent={parent}
    attachment={attachment}
    className={`attachment-button-size ${!isImageFile(attachment.filename) ? 'attachment-gray-button' : ''}`}
    disabled={!isImageFile(attachment.filename)}
  />
);

export const editButton = (
  attachment,
  extension,
  attachmentEditor,
  isEditing,
  editDisable,
  handleEdit
) => {
  const editorTooltip = (exts) => (
    <Tooltip id="editor_tooltip">
      {editDisable ? (
        <span>
          Editing is only available for these files:&nbsp;
          <strong>{exts}</strong>
          .
          <br />
          Or you are not authorized to edit this file.
        </span>
      ) : (
        <span>Edit attachment</span>
      )}
    </Tooltip>
  );
  return (
    <OverlayTrigger placement="top" overlay={editorTooltip(values(extension).join(','))}>
      <Button
        className={`attachment-button-size ${editDisable ? 'attachment-gray-button' : ''}`}
        size="sm"
        variant="success"
        disabled={editDisable}
        onClick={() => handleEdit(attachment)}
      >
        <SpinnerPencilIcon spinningLock={!attachmentEditor || isEditing} />
      </Button>
    </OverlayTrigger>
  );
};

export const importButton = (
  attachment,
  showImportConfirm,
  importDisabled,
  showImportConfirmFunction,
  hideImportConfirmFunction,
  confirmAttachmentImportFunction
) => {
  const show = showImportConfirm[attachment.id];
  const extension = attachment.filename.split('.').pop();

  const importTooltip = importDisabled || extension !== 'xlsx'
    ? <Tooltip id="import_tooltip">Invalid type for import or element must be saved before import</Tooltip>
    : <Tooltip id="import_tooltip">Import as element data</Tooltip>;

  const confirmTooltip = (
    <Tooltip placement="bottom" className="in" id="tooltip-bottom">
      Import data from Spreadsheet? This will overwrite existing data.
      <br />
      <ButtonGroup>
        <Button
          variant="success"
          size="sm"
          onClick={() => confirmAttachmentImportFunction(attachment)}
        >
          Yes
        </Button>
        <Button
          variant="warning"
          size="sm"
          onClick={() => hideImportConfirmFunction(attachment.id)}
        >
          No
        </Button>
      </ButtonGroup>
    </Tooltip>
  );

  const buttonRef = React.createRef();
  return (
    <div>
      <OverlayTrigger placement="top" overlay={importTooltip}>
        {/* add span because disabled buttons cannot trigger tooltip overlay */}
        <span>
          <Button
            size="sm"
            variant="success"
            disabled={importDisabled || extension !== 'xlsx'}
            ref={buttonRef}
            className={`attachment-button-size ${importDisabled
              || extension !== 'xlsx' ? 'attachment-gray-button' : ''}`}
            onClick={() => showImportConfirmFunction(attachment.id)}
          >
            <i className="fa fa-plus-circle" />
          </Button>
        </span>
      </OverlayTrigger>
      <Overlay
        show={show}
        placement="bottom"
        rootClose
        onHide={() => hideImportConfirmFunction(attachment.id)}
        target={buttonRef}
      >
        {confirmTooltip}
      </Overlay>
    </div>
  );
};

export const customDropzone = (onDrop) => (
  <Dropzone onDrop={onDrop} className="attachment-dropzone">
    Drop files here, or click to upload.
  </Dropzone>
);

export const sortingAndFilteringUI = (
  sortDirection,
  handleSortChange,
  toggleSortDirection,
  handleFilterChange,
  isSortingEnabled
) => (
  <div style={{
    marginBottom: '20px', display: 'flex', justifyContent: 'space-between',
  }}
  >
    {isSortingEnabled && (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label style={{ marginRight: '10px' }}>Sort: </label>
        <div className="sort-container" style={{ display: 'flex', alignItems: 'center' }}>
          <select
            onChange={handleSortChange}
            className="sorting-row-style"
            style={{ width: '100px', marginRight: '10px' }}
          >
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="date">Date</option>
          </select>
          <Button
            style={{ marginRight: '10px', marginLeft: '-15px' }}
            onClick={toggleSortDirection}
            className="sort-icon-style"
          >
            {sortDirection === 'asc' ? '▲' : '▼'}
          </Button>
        </div>
      </div>
    )}

    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label style={{ marginRight: '10px' }}>Filter: </label>
      <input
        type="text"
        placeholder="Filter by name..."
        onChange={handleFilterChange}
        className="sorting-row-style"
        style={{ width: '250px' }}
      />
    </div>
  </div>
);
