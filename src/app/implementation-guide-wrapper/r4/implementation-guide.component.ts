import {Component, DoCheck, Input, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {
    Binary,
    Coding,
    ImplementationGuide,
    OperationOutcome,
    ImplementationGuidePageComponent,
    ResourceReference,
    ImplementationGuideDefinitionComponent,
    ImplementationGuidePackageComponent, ImplementationGuideResourceComponent
} from '../../models/r4/fhir';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {ImplementationGuideService} from '../../services/implementation-guide.service';
import {Globals} from '../../globals';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'underscore';
import {PageComponentModalComponent} from './page-component-modal.component';
import {RecentItemService} from '../../services/recent-item.service';
import {FhirService} from '../../services/fhir.service';
import {FileService} from '../../services/file.service';
import {ConfigService} from '../../services/config.service';

class PageDefinition {
    public page: ImplementationGuidePageComponent;
    public parent?: ImplementationGuidePageComponent;
    public level: number;
}

@Component({
    templateUrl: './implementation-guide.component.html',
    styleUrls: ['./implementation-guide.component.css']
})
export class ImplementationGuideComponent implements OnInit, OnDestroy, DoCheck {
    @Input() public implementationGuide = new ImplementationGuide();
    public message: string;
    public currentResource: any;
    public validation: any;
    public pages: PageDefinition[];
    private unsavedBinaryAssociations: string[] = [];
    public resourceTypeCodes: Coding[] = [];
    private readonly dependencyExtensionUrl = 'https://trifolia-on-fhir.lantanagroup.com/StructureDefinition/extension-ig-dependency';
    private readonly dependencyExtensionNameUrl = 'https://trifolia-on-fhir.lantanagroup.com/StructureDefinition/extension-ig-dependency-name';
    private readonly dependencyExtensionVersionUrl = 'https://trifolia-on-fhir.lantanagroup.com/StructureDefinition/extension-ig-dependency-version';
    private readonly dependencyExtensionLocationUrl = 'https://trifolia-on-fhir.lantanagroup.com/StructureDefinition/extension-ig-dependency-location';
    private navSubscription: any;

    constructor(
        private modal: NgbModal,
        private route: ActivatedRoute,
        private router: Router,
        private implementationGuideService: ImplementationGuideService,
        private authService: AuthService,
        private configService: ConfigService,
        private recentItemService: RecentItemService,
        private fileService: FileService,
        public globals: Globals,
        private fhirService: FhirService) {
    }

    public get isNew(): boolean {
        const id  = this.route.snapshot.paramMap.get('id');
        return !id || id === 'new';
    }

    public revert() {
        this.getImplementationGuide();
    }

    private getImplementationGuide() {
        const implementationGuideId = this.route.snapshot.paramMap.get('id');

        if (implementationGuideId === 'from-file') {
            if (this.fileService.file) {
                this.implementationGuide = <ImplementationGuide> this.fileService.file.resource;
                this.nameChanged();
                this.initPages();
            } else {
                this.router.navigate(['/']);
                return;
            }
        }

        if (implementationGuideId !== 'new' && implementationGuideId) {
            this.implementationGuide = null;

            this.implementationGuideService.getImplementationGuide(implementationGuideId)
                .subscribe((results: ImplementationGuide | OperationOutcome) => {
                    if (results.resourceType !== 'ImplementationGuide') {
                        this.message = 'The specified implementation guide either does not exist or was deleted';
                        return;
                    }

                    this.implementationGuide = <ImplementationGuide> results;
                    this.nameChanged();
                    this.initPages();
                    this.recentItemService.ensureRecentItem(
                        this.globals.cookieKeys.recentImplementationGuides,
                        this.implementationGuide.id,
                        this.implementationGuide.name);
                }, (err) => {
                    this.message = err && err.message ? err.message : 'Error loading implementation guide';
                    this.recentItemService.removeRecentItem(this.globals.cookieKeys.recentImplementationGuides, implementationGuideId);
                });
        }
    }

    public tabChange(event) {
    }

    public toggleResources(hasResources: boolean) {
        if (!hasResources && this.implementationGuide.definition && this.implementationGuide.definition.resource) {
            delete this.implementationGuide.definition.resource;
        } else if (hasResources) {
            if (!this.implementationGuide.definition) {
                this.implementationGuide.definition = new ImplementationGuideDefinitionComponent();
            }

            if (!this.implementationGuide.definition.resource) {
                this.implementationGuide.definition.resource = [];
            }

            if (this.implementationGuide.definition.resource.length === 0) {
                const newResource = new ImplementationGuideResourceComponent();
                newResource.reference = new ResourceReference();
                newResource.reference.reference = '';
                newResource.reference.display = '';
                this.implementationGuide.definition.resource.push(newResource);
            }
        }
    }

    public togglePackages(hasPackages: boolean) {
        if (!hasPackages && this.implementationGuide.definition && this.implementationGuide.definition.package) {
            delete this.implementationGuide.definition.package;
        } else if (hasPackages) {
            if (!this.implementationGuide.definition) {
                this.implementationGuide.definition = new ImplementationGuideDefinitionComponent();
            }

            if (!this.implementationGuide.definition.package) {
                this.implementationGuide.definition.package = [];
            }

            if (this.implementationGuide.definition.package.length === 0) {
                const newPackage = new ImplementationGuidePackageComponent();
                newPackage.name = 'New Package';
                this.implementationGuide.definition.package.push(newPackage);
            }
        }
    }

    public toggleRootPage(value: boolean) {
        if (value && !this.implementationGuide.definition) {
            this.implementationGuide.definition = new ImplementationGuideDefinitionComponent();
        }

        if (value && !this.implementationGuide.definition.page) {
            if (!this.implementationGuide.contained) {
                this.implementationGuide.contained = [];
            }

            const newBinary = new Binary();
            newBinary.contentType = 'text/plain';
            newBinary.data = btoa('No page content yet');
            newBinary.id = this.globals.generateRandomNumber(5000, 10000).toString();
            this.implementationGuide.contained.push(newBinary);

            const newPage = new ImplementationGuidePageComponent();
            newPage.title = 'index.html';
            newPage.generation = 'markdown';
            newPage.nameReference = new ResourceReference();
            newPage.nameReference.reference = '#' + newBinary.id;
            newPage.nameReference.display = `Page content ${newBinary.id}`;
            this.implementationGuide.definition.page = newPage;
        } else if (!value && this.implementationGuide.definition.page) {
            const foundPageDef = _.find(this.pages, (pageDef) => pageDef.page === this.implementationGuide.definition.page);
            this.removePage(foundPageDef);
        }

        this.initPages();
    }

    public editPage(pageDef: PageDefinition) {
        const modalRef = this.modal.open(PageComponentModalComponent, { size: 'lg' });
        modalRef.componentInstance.implementationGuide = this.implementationGuide;
        modalRef.componentInstance.page = pageDef.page;
    }

    public addChildPage(pageDef: PageDefinition) {
        if (!this.implementationGuide.contained) {
            this.implementationGuide.contained = [];
        }

        if (!pageDef.page.page) {
            pageDef.page.page = [];
        }

        const newBinary = new Binary();
        newBinary.contentType = 'text/markdown';
        newBinary.data = btoa('No page content yet');
        newBinary.id = this.globals.generateRandomNumber(5000, 10000).toString();
        this.implementationGuide.contained.push(newBinary);

        const newPage = new ImplementationGuidePageComponent();
        newPage.title = 'index.html';
        newPage.generation = 'markdown';
        newPage.nameReference = new ResourceReference();
        newPage.nameReference.reference = '#' + newBinary.id;
        newPage.nameReference.display = `Page content ${newBinary.id}`;
        pageDef.page.page.push(newPage);

        this.initPages();
    }

    public removePage(pageDef: PageDefinition) {
        if (!pageDef) {
            return;
        }

        if (pageDef.page.page) {
            for (let i = pageDef.page.page.length - 1; i >= 0; i--) {
                const childPage = pageDef.page.page[i];
                const foundChildPageDef = _.find(this.pages, (nextPageDef) => nextPageDef.page === childPage);
                this.removePage(foundChildPageDef);
            }
        }

        // If a contained Binary resource is associated with the page, remove it
        if (pageDef.page.nameReference) {
            if (pageDef.page.nameReference.reference && pageDef.page.nameReference.reference.startsWith('#')) {
                const foundBinary = _.find(this.implementationGuide.contained, (contained) =>
                    contained.id === pageDef.page.nameReference.reference.substring(1));

                if (foundBinary) {
                    const binaryIndex = this.implementationGuide.contained.indexOf(foundBinary);
                    this.implementationGuide.contained.splice(binaryIndex, 1);
                }
            }
        }

        // Remove the page
        if (pageDef.parent) {
            const pageIndex = pageDef.parent.page.indexOf(pageDef.page);
            pageDef.parent.page.splice(pageIndex, 1);
        } else {
            delete this.implementationGuide.definition.page;
        }

        const pageDefIndex = this.pages.indexOf(pageDef);
        this.pages.splice(pageDefIndex, 1);
    }

    public isMovePageUpDisabled(pageDef: PageDefinition) {
        if (!pageDef.parent) {
            return true;
        }
        const index = pageDef.parent.page.indexOf(pageDef.page);
        return index === 0;
    }

    public movePageUp(pageDef: PageDefinition) {
        const index = pageDef.parent.page.indexOf(pageDef.page);
        pageDef.parent.page.splice(index, 1);
        pageDef.parent.page.splice(index - 1, 0, pageDef.page);
        this.initPages();
    }

    public isMovePageDownDisabled(pageDef: PageDefinition) {
        if (!pageDef.parent) {
            return true;
        }
        const index = pageDef.parent.page.indexOf(pageDef.page);
        return index === pageDef.parent.page.length - 1;
    }

    public movePageDown(pageDef: PageDefinition) {
        const index = pageDef.parent.page.indexOf(pageDef.page);
        pageDef.parent.page.splice(index, 1);
        pageDef.parent.page.splice(index + 1, 0, pageDef.page);
        this.initPages();
    }

    public save() {
        const implementationGuideId = this.route.snapshot.paramMap.get('id');

        if (!this.validation.valid && !confirm('This implementation guide is not valid, are you sure you want to save?')) {
            return;
        }

        if (implementationGuideId === 'from-file') {
            this.fileService.saveFile();
            return;
        }

        this.implementationGuideService.saveImplementationGuide(this.implementationGuide)
            .subscribe((results: ImplementationGuide) => {
                if (!this.implementationGuide.id) {
                    this.router.navigate(['/implementation-guide/' + results.id]);
                } else {
                    this.recentItemService.ensureRecentItem(this.globals.cookieKeys.recentImplementationGuides, results.id, results.name);
                    this.message = 'Successfully saved implementation guide!';
                    setTimeout(() => { this.message = ''; }, 3000);
                }
            }, (err) => {
                this.message = 'An error occured while saving the implementation guide';
            });
    }

    private initPage(page: ImplementationGuidePageComponent, level = 0, parent?: ImplementationGuidePageComponent) {
        if (!page) {
            return;
        }

        this.pages.push({
            page: page,
            level: level,
            parent: parent
        });

        if (page.page) {
            for (let i = 0; i < page.page.length; i++) {
                this.initPage(page.page[i], level + 1, page);
            }
        }
    }

    public getDefaultPackageId() {
        if (this.implementationGuide.definition && this.implementationGuide.definition.package && this.implementationGuide.definition.package.length > 0) {
            return this.implementationGuide.definition.package[0].id;
        }
        return '';
    }

    private initPages() {
        this.pages = [];

        if (this.implementationGuide.definition) {
            this.initPage(this.implementationGuide.definition.page);
        }
    }

    ngOnInit() {
        this.navSubscription = this.router.events.subscribe((e: any) => {
            if (e instanceof NavigationEnd && e.url.startsWith('/implementation-guide/')) {
                this.getImplementationGuide();
            }
        });
        this.resourceTypeCodes = this.fhirService.getValueSetCodes('http://hl7.org/fhir/ValueSet/resource-types');
        this.getImplementationGuide();
    }

    nameChanged() {
        this.configService.setTitle(`ImplementationGuide - ${this.implementationGuide.name || 'no-name'}`);
    }

    ngOnDestroy() {
        this.navSubscription.unsubscribe();
        this.configService.setTitle(null);
    }

    ngDoCheck() {
        if (this.implementationGuide) {
            this.validation = this.fhirService.validate(this.implementationGuide);
        }
    }
}