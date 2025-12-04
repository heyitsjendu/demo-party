import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import HIDE_UTILITY_CSS from '@salesforce/resourceUrl/hideUtility';

export default class UtilityManager extends LightningElement {
    connectedCallback() {
        loadStyle(this, HIDE_UTILITY_CSS).catch(error => {
            console.error('Error loading static resource: ', error);
        });
    }
}