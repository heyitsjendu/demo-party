import { LightningElement, api, track } from 'lwc';

export default class CustomerContactForm extends LightningElement {
  // UI labels configurable via lightning type properties (schema.json)
  @api title = 'Customer Contact';
  @api submitLabel = 'Submit';
  // Per LWC rule LWC1099, Boolean public property must default to false
  @api showCancel = false;

  // Tracked form state
  @track firstName = '';
  @track lastName = '';
  @track email = '';
  @track phone = '';
  // Store the local datetime string suitable for lightning-input type="datetime"
  @track bestTimeLocal = '';

  // Handle text, email, tel changes
  handleInputChange = (event) => {
    const { name, value } = event.target;
    this[name] = value;
  };

  // Handle datetime change, keep local input value and compute ISO with timezone when submitting
  handleDateTimeChange = (event) => {
    this.bestTimeLocal = event.target.value;
  };

  handleCancel = () => {
    // Notify container that user canceled (if the hosting agent panel supports it)
    this.dispatchEvent(
      new CustomEvent('cancel', {
        bubbles: true,
        composed: true
      })
    );
  };

  handleSubmit = () => {
    // Validate all inputs first
    const inputs = this.template.querySelectorAll('lightning-input');
    let allValid = true;
    inputs.forEach((input) => {
      // reportValidity triggers native UI validation
      if (!input.reportValidity()) {
        allValid = false;
      }
    });
    if (!allValid) {
      return;
    }

    // Construct payload
    const payload = {
      firstName: this.firstName?.trim(),
      lastName: this.lastName?.trim(),
      email: this.email?.trim(),
      phone: this.phone?.trim(),
      bestTimeToContact: this.computeIsoWithOffset(this.bestTimeLocal)
    };

    // Emit a generic "submit" event carrying the variables.
    // Agentforce lightning type host should capture this and map to variables defined in schema.json outputs.
    this.dispatchEvent(
      new CustomEvent('submit', {
        detail: payload,
        bubbles: true,
        composed: true
      })
    );
  };

  // Convert local datetime string (yyyy-MM-ddThh:mm) into ISO 8601 with timezone offset (e.g., 2025-12-03T13:30:00-06:00)
  computeIsoWithOffset(localString) {
    if (!localString) return '';

    // Ensure we have seconds; lightning-input datetime may omit seconds
    // new Date(local) interprets as local time when no timezone suffix is provided
    const date = new Date(localString);
    if (isNaN(date.getTime())) {
      return '';
    }

    // Get local timezone offset in minutes (note: returns minutes to add to local to get UTC, usually negative in US)
    const tzOffsetMin = date.getTimezoneOffset();
    const sign = tzOffsetMin > 0 ? '-' : '+';
    const absMin = Math.abs(tzOffsetMin);
    const offsetHours = String(Math.floor(absMin / 60)).padStart(2, '0');
    const offsetMinutes = String(absMin % 60).padStart(2, '0');
    const offset = `${sign}${offsetHours}:${offsetMinutes}`;

    // Build local date-time components (not UTC)
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}${offset}`;
  }
}
