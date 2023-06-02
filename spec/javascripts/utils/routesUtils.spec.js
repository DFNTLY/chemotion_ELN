/* eslint-env node, mocha */

import expect from 'expect';
import CollectionFactory from '../factories/CollectionFactory';

import {
  buildPathForCollectionAndElement,
} from '../../../app/packs/src/utilities/routesUtils';

describe('buildPathForCollectionAndElement', () => {
  // TODO: use Factories to create the elements
  const collection = CollectionFactory.build('dummy', { id: 1 });
  const allCollection = CollectionFactory.build('All');
  const element = { id: '2', type: 'sample' };
  const newElement = { id: null, type: 'reaction', isNew: true };
  const weirdElement = { type: 'metadata' };
  it('should return the path for the collection and element', () => {
    expect(buildPathForCollectionAndElement(collection, element)).toEqual('/collection/1/sample/2');
  });
  it('should return the path for collection none when no collection given', () => {
    expect(buildPathForCollectionAndElement(null, element)).toEqual('/collection/none/sample/2');
  });
  it('should return the path for the ALL collection when All-collection given', () => {
    expect(buildPathForCollectionAndElement(allCollection, element)).toEqual('/collection/all/sample/2');
  });
  it('should return the path for the collection and new element', () => {
    expect(buildPathForCollectionAndElement(collection, newElement)).toEqual('/collection/1/reaction/new');
  });
  it('should return the path for the collection only when an empty element is given', () => {
    expect(buildPathForCollectionAndElement(collection, {})).toEqual('/collection/1');
  });
  it('should return the path for the collection and element when weird element with no idea is given', () => {
    expect(buildPathForCollectionAndElement(collection, weirdElement)).toEqual('/collection/1/metadata');
  });
});
