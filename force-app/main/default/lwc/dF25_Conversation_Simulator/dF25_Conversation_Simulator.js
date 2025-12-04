import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';


import agentTrack1 from '@salesforce/resourceUrl/AgentTalkTrack1';
import agentTrack2 from '@salesforce/resourceUrl/AgentTalkTrack2';
import agentTrack3 from '@salesforce/resourceUrl/AgentTalkTrack3';
import agentTrack4 from '@salesforce/resourceUrl/AgentTalkTrack4';
import agentTrack5 from '@salesforce/resourceUrl/AgentTalkTrack5';

export default class dF25_Conversation_Simulator extends NavigationMixin(LightningElement) {

    handleNameClick() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: '003Wt00000OQTWpIAP', // Contact Id
                objectApiName: 'Contact',
                actionName: 'view'
            }
        });
    }


    @track currentEventIndex = 0;
    @track displayedEvents = [];
    @track isShrunk = false;
    @track shouldScroll = false;
    autoScrollEnabled = true;

    
    agentName = "Williams Sonoma Service Agent";
    customerPhone = "+16193848278";
    customerDisplayName = "Sanjna Parulekar | Inbound | +161938...";
    
    generatedTimestamps = {};

    conversationEvents = [
        { type: "event-center", 
            content: () => `Call started • ${this.getCurrentPSTTime()}`,
            iconName: 'utility:chat' 
        },
        { type: "event-center-no-border", 
            content: () => `Automated P joined the conversation • ${this.getCurrentPSTTime()}`,
            iconName: 'utility:change_owner' 
        },
        { type: "event-center-no-border", 
            content: () => `${this.agentName} joined the conversation • ${this.getCurrentPSTTime()}`, 
            iconName: 'utility:change_owner'
        },
        { type: "agent-message", 
            content: "Hi, welcome to Williams Sonoma. How can I help you?", 
            timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`,
            soundTrack: agentTrack1
        },
        { type: "customer-message", 
            content: "Hi, I think I'm ready to order the sauce pan.", 
            timestamp: () => `${this.customerPhone} • ${this.getCurrentPSTTime()}`,
        },
        { type: "agent-message", 
            content: "Hello Sanj. I see you're referring to the Copper Saucier recommendation for the Italian Braised...", 
            timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`,
            soundTrack: agentTrack2
        },
        { type: "customer-message", 
            content: "Yes... yes—that's the one! If I ordered it now, when would it be delivered?", 
            timestamp: () => `${this.customerPhone} • ${this.getCurrentPSTTime()}` 
        },
        { type: "agent-message", 
            content: "Based on your location in San Francisco, the scheduled delivery date would be Tuesday of next week.", 
            timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`, 
            soundTrack: agentTrack3
        },
        { type: "customer-message", 
            content: "Tuesday is too late, I need it by Saturday for my dinner party.", 
            timestamp: () => `${this.customerPhone} • ${this.getCurrentPSTTime()}` 
        },
        { type: "agent-message", 
            content: "I can create the order for you right now, but to guarantee Saturday delivery, we need a specialist to review shipping and inventory in real-time. " + 
            "Would you like me to generate this order and transfer you to a representative?", 
            timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`,
            soundTrack: agentTrack4 
        },
        { type: "customer-message", 
            content: "Yes, please transfer me.", 
            timestamp: () => `${this.customerPhone} • ${this.getCurrentPSTTime()}` 
        },
        { type: "agent-message", 
            content: "Connecting you to a Williams Sonoma Representative.", 
            timestamp: () => `${this.agentName} • ${this.getCurrentPSTTime()}`,
            soundTrack: agentTrack5 
        },
        { type: "event-center-top-border", 
            content: () => `Call ended • ${this.getCurrentPSTTime()}`,
            iconName: 'utility:chat' 
        },        
    ];

    connectedCallback() {
        this.renderEvents();
        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handleKeyDown);
    }
    renderedCallback() {
        // Attach scroll listener once (after the container exists)
        const scroller = this.template.querySelector('.conversation-content');
        if (scroller && !this._scrollListenerAttached) {
        this._scrollListenerAttached = true;
        scroller.addEventListener('scroll', () => {
            // Consider "near bottom" as within 24px of the real bottom
            const nearBottom =
            scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 24;
            this.autoScrollEnabled = nearBottom;
        });
        }

        if (this.shouldScroll && this.autoScrollEnabled) {
        this.shouldScroll = false;

        // Wait for DOM paint, then scroll the bottom anchor into view. This works
        // even when the true scroll container is outside your template (Utility Bar).
        Promise.resolve().then(() => {
            requestAnimationFrame(() => {
            const anchor = this.template.querySelector('[data-id="bottom-anchor"]');
            if (anchor) {
                anchor.scrollIntoView({ block: 'end' });
            } else if (scroller) {
                // Fallback if anchor not found
                scroller.scrollTop = scroller.scrollHeight;
            }
            });
        });
        } else {
        this.shouldScroll = false; // clear the flag if we chose not to autoscroll
        }
    }

    disconnectedCallback() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown(event) {
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.nextEvent();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.previousEvent();
        }
    }

    handlePhoneClick(event) {
        event.preventDefault();
    }

    handleToggleShrink() {
    console.log('handleToggleShrink called. Current isShrunk state:', this.isShrunk);
    const fullHeight = 600;
    const shrunkHeight = 45;

    if (this.isShrunk) {
        console.log('Attempting to expand to height:', fullHeight);
        setPanelHeight({ height: fullHeight })
            .then(() => {
                console.log('Panel expanded successfully.');
                this.isShrunk = false;
            })
            .catch(error => {
                console.error('Error EXPANDING utility panel:', JSON.stringify(error, null, 2));
            });
    } else {
        console.log('Attempting to shrink to height:', shrunkHeight);
        setPanelHeight({ height: shrunkHeight })
            .then(() => {
                console.log('Panel shrunk successfully.');
                this.isShrunk = true;
            })
            .catch(error => {
                console.error('Error SHRINKING utility panel:', JSON.stringify(error, null, 2));
            });
    }
}

    get toggleButtonTitle() {
         return this.isShrunk ? 'Expand' : 'Shrink';
    }


    getCurrentPSTTime() {
        const now = new Date();
        const options = {
            timeZone: "America/Los_Angeles",
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
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
        
        for (let i = 0; i <= this.currentEventIndex && i < this.conversationEvents.length; i++) {
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
                isCallEnded,

            });
        }
        this.shouldScroll = true;
       // this.scrollToBottom();
    }

scrollToBottom() {
    // Use a small timeout to ensure the DOM has finished rendering the new message
    setTimeout(() => {
        const scrollContainer = this.template.querySelector('.conversation-content');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, 0);
}

    playTrack(trackUrl) {
        if (trackUrl) {
            let audio = new Audio(trackUrl);
            audio.play().catch(error => {
                console.error("Audio playback error: ", error);
            });
        }
    }

    nextEvent() {
        if (this.currentEventIndex < this.conversationEvents.length - 1) {
            this.currentEventIndex++;
            const newEvent = this.conversationEvents[this.currentEventIndex];
            
            if (newEvent.type === 'agent-message' && newEvent.soundTrack) {
                this.playTrack(newEvent.soundTrack);
            }
            
            this.renderEvents();
        }
    }

    previousEvent() {
        if (this.currentEventIndex > -1) {
            this.currentEventIndex--;
            this.renderEvents();
        }
    }

   
      handleChevronClick() {
        if (this.isShrunk) {
            // restore to full height
            this.dispatchEvent(new CustomEvent('utilityrestore', { bubbles: true, composed: true }));
            this.isShrunk = false;
        } else {
            // shrink to 45px
            this.dispatchEvent(new CustomEvent('utilityshrink', { bubbles: true, composed: true }));
            this.isShrunk = true;
        }
    }
}