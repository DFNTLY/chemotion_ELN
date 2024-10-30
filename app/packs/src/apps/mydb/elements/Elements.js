import React, { useState, useEffect } from 'react';
import { Col } from 'react-bootstrap';

import ElementStore from 'src/stores/alt/stores/ElementStore';
import UIStore from 'src/stores/alt/stores/UIStore';

import ElementsList from 'src/apps/mydb/elements/list/ElementsList';
import ElementDetails from 'src/apps/mydb/elements/details/ElementDetails';

export default function Elements() {
  const [showDetailView, setShowDetailView] = useState(false);
  const [isDetailViewExpanded, setIsDetailViewExpanded] = useState(false);

  useEffect(() => {
    const onElementStoreChange = ({ currentElement }) => setShowDetailView(currentElement !== null);
    ElementStore.listen(onElementStoreChange);
    onElementStoreChange(ElementStore.getState());

    const onUiStoreChange = ({ isDetailViewExpanded }) => setIsDetailViewExpanded(isDetailViewExpanded);
    UIStore.listen(onUiStoreChange);
    onUiStoreChange(UIStore.getState());

    return () => {
      ElementStore.unlisten(onElementStoreChange);
      UIStore.unlisten(onUiStoreChange);
    }
  }, []);

  const detailWidth = showDetailView
    ? isDetailViewExpanded ? 12 : 7
    : 0;
  const listWidth = 12 - detailWidth;

  return (
    <div className="flex-grow-1 d-flex ps-3 pt-2">
      {!isDetailViewExpanded && (
        <Col xs={listWidth} className="pe-3">
          <ElementsList overview={!showDetailView} />
        </Col>
      )}
      {showDetailView && (
        <Col xs={detailWidth} className="pe-3">
          <ElementDetails />
        </Col>
      )}
    </div>
  );
}
