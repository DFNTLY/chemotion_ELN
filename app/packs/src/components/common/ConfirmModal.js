import React from 'react';
import { Button, Modal, ButtonToolbar } from 'react-bootstrap';

function ConfirmModal({ showModal, title, content, onClick, dialogClassName }) {
  return (
    <Modal centered animation show={showModal} dialogClassName={dialogClassName} onHide={() => onClick(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {content}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <ButtonToolbar className="gap-1">
          <Button variant="danger" onClick={() => onClick(true)}>Yes</Button>
          <Button variant="primary" onClick={() => onClick(false)}>No</Button>
        </ButtonToolbar>
      </Modal.Footer>
    </Modal>
  );
}

export { ConfirmModal };
