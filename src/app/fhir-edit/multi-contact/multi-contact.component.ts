import {Component, Input, OnInit} from '@angular/core';
import {Globals} from '../../globals';
import {ContactDetail} from '../../models/stu3/fhir';
import * as _ from 'underscore';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ContactModalComponent} from '../contact-modal/contact-modal.component';
import {FhirService} from '../../services/fhir.service';

@Component({
    selector: 'app-fhir-multi-contact',
    templateUrl: './multi-contact.component.html',
    styleUrls: ['./multi-contact.component.css']
})
export class MultiContactComponent implements OnInit {
    @Input() parentObject: any;
    @Input() propertyName: string;
    @Input() title: string;
    @Input() tooltipKey: string;
    @Input() tooltipPath: string;
    public tooltip: string;

    constructor(
        private modalService: NgbModal,
        public globals: Globals,
        private fhirService: FhirService) {

    }

    public editContact(contact: ContactDetail) {
        const ref = this.modalService.open(ContactModalComponent, { size: 'lg' });
        ref.componentInstance.contact = contact;
    }

    ngOnInit() {
        if (this.tooltipKey) {
            this.tooltip = this.globals.tooltips[this.tooltipKey];
        } else if (this.tooltipPath) {
            this.tooltip = this.fhirService.getFhirTooltip(this.tooltipPath);
        }
    }
}
