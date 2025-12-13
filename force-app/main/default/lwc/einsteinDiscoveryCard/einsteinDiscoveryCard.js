import { LightningElement, api } from 'lwc';
import FULL_HEADER_IMG from '@salesforce/resourceUrl/FullEinsteinHeaderImg';
import FILL_HEADER_IMG from '@salesforce/resourceUrl/EinsteinHeaderFill';

export default class EinsteinDiscoveryCard extends LightningElement {
    
    get headerBackgroundStyle() {
        return `background-image: url(${FULL_HEADER_IMG}), url(${FILL_HEADER_IMG});`;
    }

    @api componentTitle;
    @api overallScoreValue;
    @api overallScoreLabel;
    @api colorRangeDefinition;

    @api firstSectionLabel;
    @api firstSectionScore1; @api firstSectionText1;
    @api firstSectionScore2; @api firstSectionText2;
    @api firstSectionScore3; @api firstSectionText3;
    @api firstSectionScore4; @api firstSectionText4;
    @api firstSectionScore5; @api firstSectionText5;

    @api secondSectionLabel;
    @api secondSectionScore1; @api secondSectionText1;
    @api secondSectionScore2; @api secondSectionText2;
    @api secondSectionScore3; @api secondSectionText3;
    @api secondSectionScore4; @api secondSectionText4;
    @api secondSectionScore5; @api secondSectionText5;

    get scoreColorClass() {
        const baseClass = 'slds-text-heading_large slds-m-right_small';
        const score = parseInt(this.overallScoreValue, 10);
        
        if (isNaN(score) || !this.colorRangeDefinition) {
            return baseClass;
        }

        const ranges = this.colorRangeDefinition.split(',');
        if (ranges.length !== 3) return baseClass;

        const [redRange, yellowRange, greenRange] = ranges.map(r => r.split('-').map(Number));

        if (score >= redRange[0] && score <= redRange[1]) {
            return `${baseClass} score-red`;
        } else if (score >= yellowRange[0] && score <= yellowRange[1]) {
            return `${baseClass} score-yellow`;
        } else if (score >= greenRange[0] && score <= greenRange[1]) {
            return `${baseClass} score-green`;
        }
        
        return baseClass;
    }

    getSectionItems(sectionName) {
        const items = [];
        for (let i = 1; i <= 5; i++) {
            const score = this[`${sectionName}Score${i}`];
            const text = this[`${sectionName}Text${i}`];
            if (score && text) {
                items.push({
                    id: i,
                    score: score,
                    text: text,
                    scoreClass: score.includes('+') ? 'score-icon text-green' : 'score-icon text-red'
                });
            }
        }
        return items;
    }

    get firstSectionItems() {
        return this.getSectionItems('firstSection');
    }

    get hasFirstSectionItems() {
        return this.firstSectionItems.length > 0;
    }

    get secondSectionItems() {
        return this.getSectionItems('secondSection');
    }

    get hasSecondSectionItems() {
        return this.secondSectionItems.length > 0;
    }
}