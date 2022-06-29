import React from 'react';

const filterSharedWithMeCollection = (sharedCollections) => {
  sharedCollections = sharedCollections.filter(c => (c.shared_by !== null));

  const collections = [];
  sharedCollections.forEach((collection) => {
    let children = [];
    let label = `by ${collection.shared_by.initials}`;
    let user = {};
    let uid = -1;
    collection.collection_acls.forEach((acl) => {
      children.push(acl);
      user = acl.user;
      uid = acl.id;
    })

    const sameSharedTo = collections.find(c => (c.label == label));
    if (sameSharedTo) {
      children.forEach(c => sameSharedTo.children.push(c))
    } else {
      let sharedCollection = {}
      sharedCollection.uid = uid;
      sharedCollection.label = label;
      sharedCollection.shared_to = user;
      sharedCollection.shared_by = collection.shared_by;
      sharedCollection.children = children;
      collections.push(sharedCollection);
    }
  });
  return collections;
}

const filterMySharedCollection = (myCollections) => {
  myCollections = myCollections.filter(c => (c.is_shared === true));

  let collections = [];
  myCollections.forEach((collection) => {
    let children = []
    let label = ''
    let user = {}
    let uid = -1;
    collection.collection_acls.forEach((acl) => {
      children.push(acl);
      label = `with ${acl.user.initials}`;
      user = acl.user;
      uid = acl.id;
    })
    const sameSharedTo = collections.find(c => (c.label == label));
    if (sameSharedTo) {
      children.forEach(c => sameSharedTo.children.push(c))
    } else {
      let sharedCollection = {}
      sharedCollection.id = collection.id;
      sharedCollection.uid = uid;
      sharedCollection.label = label;
      sharedCollection.shared_to = user;
      sharedCollection.children = children;
      collections.push(sharedCollection);
    }
  });
  return collections;
}

export { filterMySharedCollection, filterSharedWithMeCollection };
