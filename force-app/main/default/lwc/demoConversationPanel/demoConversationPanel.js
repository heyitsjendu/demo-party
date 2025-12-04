import { LightningElement, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

import agentTrack1 from '@salesforce/resourceUrl/AgentTalkTrack1';
import agentTrack2 from '@salesforce/resourceUrl/AgentTalkTrack2';
import agentTrack3 from '@salesforce/resourceUrl/AgentTalkTrack3';
import agentTrack4 from '@salesforce/resourceUrl/AgentTalkTrack4';
import agentTrack5 from '@salesforce/resourceUrl/AgentTalkTrack5';
import omniSupervisorIcon from '@salesforce/resourceUrl/OmniSupervisorIcon';

export default class demoConversationPanel extends NavigationMixin(LightningElement) {
  @track isShrunk = false;
  @track displayedEvents = [];
  @track currentIndex = 0;
  autoScrollEnabled = true;
  lastRenderedIndex = -1;
  
  agentName = "Williams Sonoma Service Agent";
  customerPhone = "+18088574997";
  generatedTimestamps = {};

  get supervisorIcon() {
    return omniSupervisorIcon;
  }

  // demo conversation content matching dF25 structure
  conversationEvents = [
    { 
      type: "event-center", 
      content: () => `Call started • ${this.getCurrentPSTTime()}`,
      iconName: 'utility:chat' 
    },
    { 
      type: "event-center-no-border", 
      content: () => `Automated P joined the conversation • ${this.getCurrentPSTTime()}`,
      iconName: 'utility:change_owner' 
    },
    { 
      type: "event-center-no-border", 
      content: () => `${this.agentName} joined the conversation • ${this.getCurrentPSTTime()}`, 
      iconName: 'utility:change_owner'
    },
    { 
      type: "agent-message", 
      content: "Hi, welcome to Williams Sonoma. How can I help you?", 
      timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`,
      soundTrack: agentTrack1
    },
    { 
      type: "customer-message", 
      content: "Hi, I think I'm ready to order the sauce pan.", 
      timestamp: () => `${this.customerPhone} • ${this.getCurrentPSTTime()}`,
    },
    { 
      type: "agent-message", 
      content: "Hello Sanj. I see you're referring to the Copper Saucier recommendation for the Italian Braised...", 
      timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`,
      soundTrack: agentTrack2
    },
    { 
      type: "customer-message", 
      content: "Yes... yes—that's the one! If I ordered it now, when would it be delivered?", 
      timestamp: () => `${this.customerPhone} • ${this.getCurrentPSTTime()}` 
    },
    { 
      type: "agent-message", 
      content: "Based on your location in San Francisco, the scheduled delivery date would be Tuesday of next week.", 
      timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`, 
      soundTrack: agentTrack3
    },
    { 
      type: "customer-message", 
      content: "Tuesday is too late, I need it by Saturday for my dinner party.", 
      timestamp: () => `${this.customerPhone} • ${this.getCurrentPSTTime()}` 
    },
    { 
      type: "agent-message", 
      content: "I can create the order for you right now, but to guarantee Saturday delivery, we need a specialist to review shipping and inventory in real-time. " + 
      "Would you like me to generate this order and transfer you to a representative?", 
      timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`,
      soundTrack: agentTrack4 
    },
    { 
      type: "customer-message", 
      content: "Yes, please transfer me.", 
      timestamp: () => `${this.customerPhone} • ${this.getCurrentPSTTime()}` 
    },
    { 
      type: "agent-message", 
      content: "Connecting you to a Williams Sonoma Representative.", 
      timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`,
      soundTrack: agentTrack5 
    },
    { 
      type: "event-center-top-border", 
      content: () => `Call ended • ${this.getCurrentPSTTime()}`,
      iconName: 'utility:chat' 
    }
  ];

  connectedCallback() {
    this.renderEvents();

    this._onMessage = (evt) => {
      const msg = evt?.data || {};
      if (msg.type === 'OPEN_CONVO_DEMO') {
        this.dispatchEvent(new CustomEvent('utilityrestore', { bubbles: true, composed: true }));
        this.isShrunk = false;
        this.currentIndex = 0;
        this.lastRenderedIndex = -1;
        this.generatedTimestamps = {};
        this.renderEvents();
      }
    };
    window.addEventListener('message', this._onMessage);

    this._onKey = (evt) => {
      if (evt && evt.key === 'ArrowRight') {
        evt.preventDefault();
        this.nextEvent();
      }
    };
    window.addEventListener('keydown', this._onKey);
  }

  disconnectedCallback() {
    window.removeEventListener('message', this._onMessage);
    window.removeEventListener('keydown', this._onKey);
  }

  @api openPanel() {
    this.dispatchEvent(new CustomEvent('utilityrestore', { bubbles: true, composed: true }));
    this.isShrunk = false;
    this.currentIndex = 0;
    this.lastRenderedIndex = -1;
    this.generatedTimestamps = {};
    this.renderEvents();
  }

  getCurrentPSTTime() {
    const now = new Date();
    const options = {
      timeZone: "America/Los_Angeles",
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);
    const timeValues = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

    return `${timeValues.month}/${timeValues.day}/${timeValues.year}, ${timeValues.hour}:${timeValues.minute}:${timeValues.second} ${timeValues.dayPeriod} PDT`;
  }

  renderEvents() {
    this.displayedEvents = [];
    
    for (let i = 0; i <= this.currentIndex && i < this.conversationEvents.length; i++) {
      const event = this.conversationEvents[i];

      if (!this.generatedTimestamps[i]) {
        this.generatedTimestamps[i] = {
          content: typeof event.content === 'function' ? event.content() : event.content,
          timestamp: typeof event.timestamp === 'function' ? event.timestamp() : event.timestamp
        };
      }

      const cachedEvent = this.generatedTimestamps[i];
      const timestampParts = (cachedEvent.timestamp || '').split(' • ');

      const contentStr = String(cachedEvent.content || '');
      const isCallEnded = /(^|\s)call ended(\s|$)/i.test(contentStr);

      this.displayedEvents.push({
        id: i,
        type: event.type,
        content: cachedEvent.content,
        timestamp: cachedEvent.timestamp,
        time: timestampParts.length > 1 ? timestampParts[1] : '',
        isEventCenter: event.type === 'event-center',
        isEventCenterNoBorder: event.type === 'event-center-no-border',
        isEventCenterTopBorder: event.type === 'event-center-top-border',
        isAgentMessage: event.type === 'agent-message',
        isCustomerMessage: event.type === 'customer-message',
        isCallEnded
      });
    }

    Promise.resolve().then(() => {
      if (this.autoScrollEnabled) {
        const anchor = this.template.querySelector('[data-id="bottom-anchor"]');
        if (anchor) {
          anchor.scrollIntoView({ block: 'end' });
        }
      }
    });
  }

  playTrack(trackUrl) {
    return new Promise((resolve, reject) => {
      if (trackUrl) {
        let audio = new Audio(trackUrl);
        audio.addEventListener('ended', () => resolve());
        audio.addEventListener('error', (error) => {
          console.error("Audio playback error: ", error);
          reject(error);
        });
        audio.play().catch(error => {
          console.error("Audio playback error: ", error);
          reject(error);
        });
      } else {
        resolve();
      }
    });
  }

  nextEvent() {
    if (this.currentIndex < this.conversationEvents.length - 1) {
      this.currentIndex++;
      const newEvent = this.conversationEvents[this.currentIndex];
      
      if (newEvent.type === 'agent-message' && newEvent.soundTrack) {
        // Play audio first, then render the message
        this.playTrack(newEvent.soundTrack)
          .then(() => {
            this.renderEvents();
          })
          .catch(() => {
            // If audio fails, still show the message
            this.renderEvents();
          });
      } else {
        // For non-agent messages, render immediately
        this.renderEvents();
      }
    }
  }

  handleMinimizeClick() {
    if (!this.isShrunk) {
      this.dispatchEvent(new CustomEvent('utilityshrink', { bubbles: true, composed: true }));
      this.isShrunk = true;
    }
  }

  handleMaximizeClick() {
    if (this.isShrunk) {
      this.dispatchEvent(new CustomEvent('utilityrestore', { bubbles: true, composed: true }));
      this.isShrunk = false;
    }
  }

  handleCloseClick() {
    this.dispatchEvent(new CustomEvent('utilityclose', { bubbles: true, composed: true }));
  }

  handleNameClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: '003Wt00000OQTWpIAP', 
        objectApiName: 'Contact',
        actionName: 'view'
      }
    });
  }

  onScroll(evt) {
    const scroller = evt.currentTarget;
    this.autoScrollEnabled = (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 24);
  }
}