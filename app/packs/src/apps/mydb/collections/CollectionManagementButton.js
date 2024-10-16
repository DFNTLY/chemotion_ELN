import React from 'react';
import { Button } from 'react-bootstrap';
import Aviator from 'aviator';

import UIActions from 'src/stores/alt/actions/UIActions';
import UIStore from 'src/stores/alt/stores/UIStore';
import ElementStore from 'src/stores/alt/stores/ElementStore';

function urlForCurrentElement() {
  const { currentElement } = ElementStore.getState();
  if (!currentElement) return '';

  return `${currentElement.type}/${currentElement.isNew ? 'new' : currentElement.id}`;
}

function handleCollectionManagementToggle() {
  UIActions.toggleCollectionManagement();
  const { showCollectionManagement, currentCollection, isSync } = UIStore.getState();
  if (showCollectionManagement) {
    Aviator.navigate('/collection/management');
  } else {
    if (currentCollection == null || currentCollection.label == 'All') {
      Aviator.navigate(`/collection/all/${urlForCurrentElement()}`);
    } else {
      Aviator.navigate(isSync
        ? `/scollection/${currentCollection.id}/${urlForCurrentElement()}`
        : `/collection/${currentCollection.id}/${urlForCurrentElement()}`);
    }
  }
}

export default function CollectionManagementButton() {
  return (
    <Button
      id="collection-management-button"
      variant="info"
      title="Manage & organize collections: create or delete collections, adjust sharing options, adjust the visibility of tabs based on the collection level"
      onClick={handleCollectionManagementToggle}
    >
      <i className="fa fa-cog me-1" />
      Manage Collections
    </Button>
  );
}
