import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ValuesetExpandComponent} from './valueset-expand.component';
import {BrowserModule} from '@angular/platform-browser';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientModule} from '@angular/common/http';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {ValueSetService} from '../services/value-set.service';
import {FhirStringComponent} from '../fhir-edit/string/string.component';
import {FhirBooleanComponent} from '../fhir-edit/boolean/boolean.component';
import {TooltipIconComponent} from '../tooltip-icon/tooltip-icon.component';
import {FhirService} from '../services/fhir.service';
import {ConfigService} from '../services/config.service';
import {CookieService} from 'angular2-cookie/core';
import {FhirDateComponent} from '../fhir-edit/date/date.component';
import {FhirEditNumberComponent} from '../fhir-edit/number/number.component';
import {RawResourceComponent} from '../raw-resource/raw-resource.component';
import {FhirXmlPipe} from '../pipes/fhir-xml-pipe';

describe('ValuesetExpandComponent', () => {
    let component: ValuesetExpandComponent;
    let fixture: ComponentFixture<ValuesetExpandComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ValuesetExpandComponent,
                FhirStringComponent,
                FhirBooleanComponent,
                TooltipIconComponent,
                FhirDateComponent,
                FhirEditNumberComponent,
                RawResourceComponent,
                FhirXmlPipe
            ],
            imports: [
                BrowserModule,
                RouterTestingModule,
                HttpClientModule,
                NgbModule.forRoot(),
                FormsModule
            ],
            providers: [
                ValueSetService,
                FhirService,
                ConfigService,
                CookieService
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ValuesetExpandComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
