import React, { useState, useEffect } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';

import UIStore from 'src/stores/alt/stores/UIStore';
import UIActions from 'src/stores/alt/actions/UIActions';

export default function DetailViewExpansionToggleButton() {
  const { isDetailViewExpanded } = UIStore.getState();
  const [isExpanded, setIsExpanded] = useState(isDetailViewExpanded);
  useEffect(() => {
    const onUIStoreChange = (s) => setIsExpanded(s.isDetailViewExpanded);
    UIStore.listen(onUIStoreChange);
    return () => UIStore.unlisten(onUIStoreChange);
  })

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={(
        <Tooltip>
          {isExpanded ? 'Collapse' : 'Expand'} Detail View
        </Tooltip>
      )}
    >
      <Button
        variant="info"
        size="xxsm"
        onClick={UIActions.toggleDetailViewExpansion}
      >
        <i className={`fa ${isExpanded ? 'fa-compress' : 'fa-expand'}`} />
      </Button>
    </OverlayTrigger>
  );
}
