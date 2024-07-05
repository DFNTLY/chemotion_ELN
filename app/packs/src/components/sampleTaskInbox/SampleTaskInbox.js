import { DragDropItemTypes } from 'src/utilities/DndConst';
import Draggable from 'react-draggable';
import React, { useContext, useState } from 'react';
import SampleTaskCard from 'src/components/sampleTaskInbox/SampleTaskCard';
import SampleTaskReloadButton from 'src/components/sampleTaskInbox/SampleTaskReloadButton';
import { Button, Card, Modal } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { StoreContext } from 'src/stores/mobx/RootStore';
import { useDrop } from 'react-dnd';
import NotificationActions from 'src/stores/alt/actions/NotificationActions';

const SampleTaskInbox = ({}) => {
  const sampleTasksStore = useContext(StoreContext).sampleTasks;
  const [deltaPosition, setDeltaPosition] = useState({ x: 0, y: 0 });

  const getSampleFromItem = (item, itemType) => {
    if (itemType === 'sample') {
      return item.element;
    }
    if (itemType === 'material') {
      return item.material;
    }
  }
  const dropConfig = (required_scan_results = 1) => {
    return {
      accept: [
        DragDropItemTypes.SAMPLE,
        DragDropItemTypes.MATERIAL
      ],
      drop: (item, monitor) => {
        let sample = getSampleFromItem(item, monitor.getItemType())
        let sampleTaskForSampleAlreadyExists = sampleTasksStore.sampleTaskForSample(sample.id);
        if (sampleTaskForSampleAlreadyExists) {
          // create notification
          sendErrorNotification(`SampleTask for sample id ${sample.id} already exists`);
        } else {
          sampleTasksStore.createSampleTask(sample.id, required_scan_results);
        }
      },
    }
  };
  const [_colProps1, singleScanDropRef] = useDrop(dropConfig(1));
  const [_colProps2, doubleScanDropRef] = useDrop(dropConfig(2));
  const sendErrorNotification = (message) => {
    const notification = {
      title: message,
      message: message,
      level: 'error',
      dismissible: 'button',
      autoDismiss: 5,
      position: 'tr',
      uid: 'SampleTaskInbox'
    };
    NotificationActions.add(notification);
  }

  const openSampleTaskCount = () => {
    let count = sampleTasksStore.openSampleTaskCount;
    if (count === 0) { return 'no'; }
    return count;
  }

  const openSampleTasks = () => {
    return sampleTasksStore.sortedSampleTasks.map(
      sampleTask => (<SampleTaskCard sampleTask={sampleTask} key={`sampleTask_${sampleTask.id}`} />)
    );
  }

  const sampleDropzone = (dropRef, text, subtext) => {
    const style = {
      padding: 10,
      borderStyle: 'dashed',
      textAlign: 'center',
      color: 'gray',
      marginTop: '12px',
      marginBottom: '8px'
    };

    return (
      <Card>
        <Card.Footer>
          <div style={style} ref={dropRef}>
            {text}
            <br />
            {subtext}
          </div>
        </Card.Footer>
      </Card>
    );
  };

  const handleDrag = (e, ui) => {
    const { x, y } = deltaPosition;
    setDeltaPosition({
      x: x + ui.deltaX,
      y: y + ui.deltaY,
    });
  }

  return (
    <Draggable handle=".modal-header" onDrag={handleDrag}>
      <div>
        <Modal
          show={sampleTasksStore.inboxVisible}
          onHide={sampleTasksStore.hideSampleTaskInbox}
          backdrop={false}
          keyboard={false}
          centered
          size="xl"
          className="draggable-modal-dialog"
          dialogClassName="draggable-modal"
          scrollable={true}
          style={{
            transform: `translate(${deltaPosition.x}px, ${deltaPosition.y}px)`,
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title className="handle draggable-modal-stack-title">
              <SampleTaskReloadButton />
              &nbsp;
              {openSampleTaskCount()} open SampleTasks
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {openSampleTasks()}
          </Modal.Body>

          <Modal.Footer className="flex-column openSampleTasks">
            <div className="container">
              <div className="row sampleTaskCreationDropzones">
                <div className="col">
                  {sampleDropzone(singleScanDropRef, 'Drop Sample to create a Single Scan Task', '(weighing only compound)')}
                </div>
                <div className="col">
                  {sampleDropzone(doubleScanDropRef, 'Drop Sample to create a Double Scan Task', '(weighing vessel and vessel+compound to calculate difference)')}
                </div>
              </div>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    </Draggable>
  );
}

export default observer(SampleTaskInbox);
