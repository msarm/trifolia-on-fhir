import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FhirService} from '../../shared/fhir.service';
import {getErrorString} from '../../../../../../libs/tof-lib/src/lib/helper';
import {ConfigService} from '../../shared/config.service';
import {Router} from '@angular/router';

@Component({
  templateUrl: './change-resource-id-modal.component.html',
  styleUrls: ['./change-resource-id-modal.component.css']
})
export class ChangeResourceIdModalComponent implements OnInit {
  @Input() resourceType: string;
  @Input() originalId: string;
  public newId: string;
  public message: string;

  constructor(
    public activeModal: NgbActiveModal,
    private router: Router,
    private configService: ConfigService,
    private fhirService: FhirService) {
  }

  public ok() {
    const newId = this.newId;
    this.fhirService.changeResourceId(this.resourceType, this.originalId, newId)
      .subscribe(() => {
        if (this.resourceType === 'ImplementationGuide' && this.originalId === this.configService.project.implementationGuideId) {
          // noinspection JSIgnoredPromiseFromCall
          this.configService.project.implementationGuideId = newId;
          this.router.navigate([`${this.configService.fhirServer}/${newId}/implementation-guide`]);
        }

        this.activeModal.close(this.newId);
      }, (err) => {
        this.message = getErrorString(err);
      });
  }

  get idIsValid() {
    if (!this.newId) return false;
    const theRegex = /^[A-Za-z0-9\-\.]{1,64}$/gm;
    return theRegex.test(this.newId);
  }

  ngOnInit() {
    this.newId = this.originalId;
  }
}
