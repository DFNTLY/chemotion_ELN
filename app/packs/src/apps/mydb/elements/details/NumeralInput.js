import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Numeral from 'numeral';
import {
  FormGroup,
  FormControl,
  InputGroup,
} from 'react-bootstrap';
import ControlLabel from 'src/components/legacyBootstrap/ControlLabel'

export default class NumeralInput extends Component {
  constructor(props) {
    super(props);

    let { value } = props;
    this.state = {
      numeralValue: this._convertValueToNumeralValue(value)
    };
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    let { value } = nextProps;
    this.setState({
      numeralValue: this._convertValueToNumeralValue(value)
    });
  }

  _convertValueToNumeralValue(value) {
    let { numeralFormat } = this.props;
    let numeralValue = null;

    try {
      numeralValue = Numeral(value).format(numeralFormat);
    } catch (err) {
      console.log(`Error in NumeralInput component: ${err}`);
    }

    return numeralValue;
  }

  //TODO fix issue that cursor is behind, when numeral inserts a comma:
  // containing comas need to be compared to previous amount
  _handleInputValueChange(event) {
    const inputField = event.target;
    const { value, selectionStart } = inputField;
    const formatedValue = this._convertValueToNumeralValue(value);
    const unformatedValue = Numeral().unformat(formatedValue);
    const { onChange } = this.props;

    this.setState(
      { numeralValue: formatedValue },
      () => { inputField.selectionStart = selectionStart; }
    );
    onChange(unformatedValue);
  }

  render() {
    let { bsSize, variant, addonAfter, buttonAfter, label, disabled } = this.props;
    let { numeralValue } = this.state;
    let addonAfterWrapper, buttonAfterWrapper;
    if (addonAfter) {
      addonAfterWrapper = <InputGroup.Text>{addonAfter}</InputGroup.Text>;
    }

    if(buttonAfter) {
      buttonAfterWrapper = <InputGroup.Button>{buttonAfter}</InputGroup.Button>;
    }

    return (
      <FormGroup>
        <ControlLabel>{label}</ControlLabel>
        <InputGroup>
          <FormControl type='text'  value={numeralValue || ''} bsSize={bsSize}
            variant={variant}
            disabled={disabled}
            onChange={ event => this._handleInputValueChange(event)} />
          {buttonAfterWrapper}
          {addonAfterWrapper}
        </InputGroup>
      </FormGroup>
    );
  }
}

NumeralInput.defaultProps = {
  numeralFormat: '',
  value: 0,
  onChange: () => {
  }
};

NumeralInput.propTypes = {
  onChange: PropTypes.func,
  numeralFormat: PropTypes.string,
  disabled: PropTypes.bool,
  addonAfter: PropTypes.node,
  buttonAfter: PropTypes.node,
  label: PropTypes.node,
  bsSize: PropTypes.string,
  variant: PropTypes.string,
};
