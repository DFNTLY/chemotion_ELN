/* global describe, context, it */

import React from 'react';
import expect from 'expect';
import Enzyme, { shallow } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import ImageAnnotationEditButton from 'src/apps/mydb/elements/details/researchPlans/ImageAnnotationEditButton';
import Attachment from 'src/models/Attachment';

import { Button } from 'react-bootstrap';

Enzyme.configure({ adapter: new Adapter() });

describe('ImageAnnotationEditButton', () => {
  const pngAttachment = new Attachment({ filename: 'example.png' });
  const parent = {};

  describe('.render()', () => {
    context('with not persisted attachment(png)', () => {
      pngAttachment.isNew = true;
      const wrapper = shallow(<ImageAnnotationEditButton attachment={pngAttachment} parent={parent} />);

      it('button is rendered but disabled', () => {
        const button = wrapper.find(Button);
        expect(button.prop('disabled')).toBeTruthy();
        expect(button.exists('.fa-pencil-square')).toBeTruthy();
      });
    });

    context('with persisted attachment(png)', () => {
      pngAttachment.isNew = false;
      const wrapper = shallow(<ImageAnnotationEditButton attachment={pngAttachment} parent={parent} />);

      it('button is rendered and not disabled', () => {
        const button = wrapper.find(Button);
        expect(button.prop('disabled')).toBeFalsy();
        expect(button.exists('.fa-pencil-square')).toBeTruthy();
      });
    });

    context('with no attachment', () => {
      const wrapper = shallow(<ImageAnnotationEditButton attachment={null} parent={parent} />);

      it('button is not rendered', () => {
        expect(wrapper.html()).toEqual(null);
      });
    });
  });
});
