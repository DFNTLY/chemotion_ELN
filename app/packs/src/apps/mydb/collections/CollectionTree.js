import React from 'react';
import { Button, OverlayTrigger, Badge, Glyphicon, Tooltip } from 'react-bootstrap';
import update from 'immutability-helper';
import Aviator from 'aviator';
import CollectionStore from 'src/stores/alt/stores/CollectionStore';
import CollectionSubtree from 'src/apps/mydb/collections/CollectionSubtree';
import UIActions from 'src/stores/alt/actions/UIActions';
import UIStore from 'src/stores/alt/stores/UIStore';
import ElementStore from 'src/stores/alt/stores/ElementStore';
import UserInfos from 'src/apps/mydb/collections/UserInfos';
import { filterMySharedCollection, filterSharedWithMeCollection } from './CollectionTreeStructure'

const colVisibleTooltip = <Tooltip id="col_visible_tooltip">Toggle own collections</Tooltip>;

export default class CollectionTree extends React.Component {
  constructor(props) {
    super(props);

    const { myCollectionTree, lockedCollectionTree, sharedCollectionTree } = CollectionStore.getState();

    this.state = {
      myCollectionTree,
      lockedCollectionTree,
      sharedCollectionTree,
      ownCollectionVisible: true,
      sharedWithCollectionVisible: false,
      sharedToCollectionVisible: false,
      visible: false,
      root: {},
      selected: false,
    };

    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    CollectionStore.listen(this.onChange);
  }

  componentWillUnmount() {
    CollectionStore.unlisten(this.onChange);
  }

  handleSectionToggle = (visible) => {
    this.setState((prevState) => ({
      [visible]: !prevState[visible],
    }));
  };

  onChange(state) {
    this.setState(state);
  }

  removeOrphanRoots(roots) {
    let newRoots = []
    roots.forEach((root) => {
      if (root.children.length > 0) newRoots.push(root)
    })

    return newRoots;
  }

  lockedTrees() {
    const { lockedCollectionTree } = this.state;
    const subtrees = lockedCollectionTree.map((root) => (
      <CollectionSubtree root={root} key={`lockedCollection-${root.id}`} />
    ));

    return (
      <div>
        <div style={{ display: '' }}>
          {subtrees}
        </div>
      </div>
    );
  }

  myCollections() {
    const { myCollectionTree } = this.state;
    const subtrees = myCollectionTree.map((root) => (
      <CollectionSubtree root={root} key={`collection-${root.id}`} />
    ));

    return (
      <div>
        <div style={{ display: '' }}>
          {subtrees}
        </div>
      </div>
    );
  }

  inboxSubtrees() {
    const { inbox, itemsPerPage } = this.state;

    let boxes = '';
    if (inbox.children) {
      inbox.children.sort((a, b) => {
        if (a.name > b.name) { return 1; } if (a.name < b.name) { return -1; } return 0;
      });
      boxes = inbox.children.map((deviceBox) => (
        <DeviceBox key={`box_${deviceBox.id}`} device_box={deviceBox} fromCollectionTree />
      ));
    }

    return (
      <div className="tree-view">
        <div
          role="button"
          onClick={InboxActions.showInboxModal}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              InboxActions.showInboxModal();
            }
          }}
        >
          {boxes}
          {inbox.children && inbox.children.length >= itemsPerPage ? (
            <div className="title" key="more" style={{ textAlign: 'center' }}>
              <i className="fa fa-ellipsis-h" aria-hidden="true" />
            </div>
          ) : ''}
        </div>
        {inbox.unlinked_attachments ? (
          <UnsortedBox
            key="unsorted_box"
            unsorted_box={inbox.unlinked_attachments}
            fromCollectionTree
          />
        ) : ''}
      </div>
    );
  }

  sharedByMeSubtrees() {
    const { myCollectionTree } = this.state;

    let { sharedToCollectionVisible } = this.state;
    let collections =
      myCollectionTree.filter(c => (c.collection_acls && c.collection_acls.length > 0));

    let sharedLabelledRoots = {};
    sharedLabelledRoots = collections.map(e => {
      return update(e, {
        label: { $set: <span>{e.label}</span> }
      })
    })

    let subTreeLabels = (
      <div className="tree-view">
        <div id="synchron-home-link" className="title" style={{backgroundColor:'white'}}
             onClick={() => this.setState({ sharedToCollectionVisible: !sharedToCollectionVisible })}>
          <i className="fa fa-share-alt" />&nbsp;&nbsp;
          Shared by me &nbsp;
        </div>
      </div>
    )

    return this.subtrees(sharedLabelledRoots, subTreeLabels, sharedToCollectionVisible)
  }

  sharedWithMeSubtrees() {
    let { sharedCollectionTree, sharedWithCollectionVisible } = this.state;

// TODO : remove this when we have a better way to handle this
    let sharedLabelledRoots = {};
    sharedLabelledRoots = sharedCollectionTree.map(e => {
      return update(e, {
        label: { $set: <span>{e.label}</span> }
      })
    })

    let subTreeLabels = (
      <div className="tree-view">
        <div
          id="synchron-home-link"
          className="title"
          style={{ backgroundColor: 'white' }}
          onClick={() => this.handleSectionToggle('sharedWithCollectionVisible')}
        >
          <i className="fa fa-share-alt" />&nbsp;&nbsp;
          Shared with me &nbsp;
        </div>
      </div>
    )

    return this.subtrees(sharedLabelledRoots, subTreeLabels, sharedWithCollectionVisible)
  }


  labelRoot(sharedToOrBy, rootCollection) {
    let collection = rootCollection[sharedToOrBy]
    if (!collection) return <span />

    return (
      <OverlayTrigger placement="bottom" overlay={UserInfos({ users:[collection] })}>
        <span>
          &nbsp; {sharedToOrBy == 'shared_to' ? 'with' : 'by'}
          &nbsp; {sharedToOrBy == 'shared_to' ? collection.initials : rootCollection.shared_by.initials}
        </span>
      </OverlayTrigger>
    )
  }

  convertToSlug(name) {
    return name.toLowerCase()
  }

  subtrees(roots, label, visible = true) {

    if (roots.length == undefined ) return <div />
    let subtrees = roots.map((root, index) => {
      return <CollectionSubtree root={root} key={index} />
    })

    let subtreesVisible = visible ? "" : "none"
    return (
      <div>
        {label}
        <div style={{ display: subtreesVisible }}>
          {subtrees}
        </div>
      </div>
    )
  }

  collectionManagementButton() {
    return (
      <div className="take-ownership-btn">
        <Button id="collection-management-button" bsSize="xsmall" bsStyle="danger"
          title="Manage & organize collections: create or delete collections, adjust sharing options, adjust the visibility of tabs based on the collection level"
          onClick={() => this.handleCollectionManagementToggle()}>
          <i className="fa fa-cog"></i>
        </Button>
      </div>
    )
  }

  handleCollectionManagementToggle() {
    UIActions.toggleCollectionManagement();

    if (showCollectionManagement) {
      Aviator.navigate('/collection/management');
      return;
    }
    AviatorNavigation({});
  }

  render() {
    const { ownCollectionVisible } = this.state;

    const ownCollectionDisplay = ownCollectionVisible ? '' : 'none';

    return (
      <div>
        <div className="tree-view">
          {this.collectionManagementButton()}
          <OverlayTrigger placement="top" delayShow={1000} overlay={colVisibleTooltip}>
            <div
              className="title"
              style={{ backgroundColor: 'white' }}
              onClick={() => this.handleSectionToggle('ownCollectionVisible')}
            >
              <i className="fa fa-list" /> &nbsp;&nbsp; Collections
            </div>
          </OverlayTrigger>
        </div>
        <div className="tree-wrapper" style={{ display: ownCollectionDisplay }}>
          {this.lockedTrees()}
          {this.myCollections()}
        </div>

        <div className="tree-wrapper">
          {this.sharedByMeSubtrees()}
        </div>
        <div className="tree-wrapper">
          {this.sharedWithMeSubtrees()}
        </div>
      </div>
    );
  }
}
