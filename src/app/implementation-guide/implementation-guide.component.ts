import {Component, DoCheck, Input, OnDestroy, OnInit, SimpleChange} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Binary, CapabilityStatement, Coding, Extension, ImplementationGuide, PageComponent} from '../models/stu3/fhir';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {ImplementationGuideService} from '../services/implementation-guide.service';
import {Observable} from 'rxjs';
import {Globals} from '../globals';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'underscore';
import {PageComponentModalComponent} from '../fhir-edit/page-component-modal/page-component-modal.component';
import {RecentItemService} from '../services/recent-item.service';
import {BinaryService} from '../services/binary.service';
import {FhirService} from '../services/fhir.service';
import {FileService} from '../services/file.service';

class PageDefinition {
    public page: PageComponent;
    public parent?: PageComponent;
    public level: number;
}

@Component({
    selector: 'app-implementation-guide',
    templateUrl: './implementation-guide.component.html',
    styleUrls: ['./implementation-guide.component.css']
})
export class ImplementationGuideComponent implements OnInit, OnDestroy, DoCheck {
    @Input() public implementationGuide?: ImplementationGuide;
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
        private recentItemService: RecentItemService,
        private fileService: FileService,
        public globals: Globals,
        private fhirService: FhirService) {
    }

    public get isNew(): boolean {
        const id  = this.route.snapshot.paramMap.get('id');
        return !id || id === 'new';
    }

    public get dependencies(): Extension[] {
        return _.filter(this.implementationGuide.extension, (extension: Extension) => extension.url === this.dependencyExtensionUrl);
    }

    public removeDependency(dependency: Extension) {
        const index = this.implementationGuide.extension.indexOf(dependency);
        this.implementationGuide.extension.splice(index);
    }

    public addDependency() {
        if (!this.implementationGuide.extension) {
            this.implementationGuide.extension = [];
        }

        const newDependency = new Extension();
        newDependency.url = this.dependencyExtensionUrl;

        this.implementationGuide.extension.push(newDependency);
    }

    public getDependencyLocation(dependency: Extension): string {
        const locationExtension = _.find(dependency.extension, (extension: Extension) => extension.url === this.dependencyExtensionLocationUrl);

        if (locationExtension) {
            return locationExtension.valueUri;
        }
    }

    public setDependencyLocation(dependency: Extension, name: string) {
        let locationExtension = _.find(dependency.extension, (extension: Extension) => extension.url === this.dependencyExtensionLocationUrl);

        if (!locationExtension) {
            locationExtension = new Extension();
            locationExtension.url = this.dependencyExtensionLocationUrl;

            if (!dependency.extension) {
                dependency.extension = [];
            }

            dependency.extension.push(locationExtension);
        }

        locationExtension.valueUri = name;
    }

    public getDependencyName(dependency: Extension): string {
        const nameExtension = _.find(dependency.extension, (extension: Extension) => extension.url === this.dependencyExtensionNameUrl);

        if (nameExtension) {
            return nameExtension.valueString;
        }
    }

    public setDependencyName(dependency: Extension, name: string) {
        let nameExtension = _.find(dependency.extension, (extension: Extension) => extension.url === this.dependencyExtensionNameUrl);

        if (!nameExtension) {
            nameExtension = new Extension();
            nameExtension.url = this.dependencyExtensionNameUrl;

            if (!dependency.extension) {
                dependency.extension = [];
            }

            dependency.extension.push(nameExtension);
        }

        nameExtension.valueString = name;
    }

    public getDependencyVersion(dependency: Extension): string {
        const versionExtension = _.find(dependency.extension, (extension: Extension) => extension.url === this.dependencyExtensionVersionUrl);

        if (versionExtension) {
            return versionExtension.valueString;
        }
    }

    public setDependencyVersion(dependency: Extension, version: string) {
        let versionExtension = _.find(dependency.extension, (extension: Extension) => extension.url === this.dependencyExtensionVersionUrl);

        if (!versionExtension) {
            versionExtension = new Extension();
            versionExtension.url = this.dependencyExtensionVersionUrl;

            if (!dependency.extension) {
                dependency.extension = [];
            }

            dependency.extension.push(versionExtension);
        }

        versionExtension.valueString = version;
    }

    public addPackageEntry(packagesTabSet) {
        this.implementationGuide.package.push({ name: '', resource: [{ name: '', sourceUri: '', example: false }] });

        setTimeout(() => {
            const lastIndex = this.implementationGuide.package.length - 1;
            const newPackageTabId = 'package-' + lastIndex.toString();
            packagesTabSet.select(newPackageTabId);
        }, 50);    // 50ms timeout... should occur pretty quickly
    }

    public revert() {
        this.getImplementationGuide();
    }

    private getImplementationGuide() {
        const implementationGuideId = this.route.snapshot.paramMap.get('id');

        if (implementationGuideId === 'from-file') {
            if (this.fileService.file) {
                this.implementationGuide = <ImplementationGuide> this.fileService.file.resource;
            } else {
                this.router.navigate(['/']);
                return;
            }
        }

        if (implementationGuideId !== 'new' && implementationGuideId) {
            this.implementationGuideService.getImplementationGuide(implementationGuideId)
                .subscribe((results: ImplementationGuide) => {
                    this.implementationGuide = results;
                    this.initPages();
                    this.recentItemService.ensureRecentItem(
                        this.globals.cookieKeys.recentImplementationGuides,
                        this.implementationGuide.id,
                        this.implementationGuide.name);
                }, (err) => {
                    this.message = 'Error loading implementation guide';
                });
        }
    }

    public getResourceSourceType(resource) {
        if (resource.hasOwnProperty('sourceUri')) {
            return 'uri';
        } else if (resource.hasOwnProperty('sourceReference')) {
            return 'reference';
        }
    }

    public editPackageResourceModal(resource, content) {
        this.currentResource = resource;
        this.modal.open(content, { size: 'lg' });
    }

    public closePackageResourceModal(cb) {
        cb();
    }

    public setResourceSourceType(resource, type) {
        delete resource['sourceUri'];
        delete resource['sourceReference'];

        if (type === 'uri') {
            resource['sourceUri'] = '';
        } else if (type === 'reference') {
            resource['sourceReference'] = {
                reference: '',
                display: ''
            };
        }
    }

    public toggleRootPage(value: boolean) {
        if (value && !this.implementationGuide.page) {
            if (!this.implementationGuide.contained) {
                this.implementationGuide.contained = [];
            }

            const newBinary = new Binary();
            newBinary.contentType = 'text/plain';
            newBinary.content = btoa('No page content yet');
            newBinary.id = this.globals.generateRandomNumber(5000, 10000).toString();
            this.implementationGuide.contained.push(newBinary);

            const newPage = new PageComponent();
            newPage.kind = 'page';
            newPage.extension = [{
                url: this.globals.extensionIgPageContentUrl,
                valueReference: {
                    reference: '#' + newBinary.id,
                    display: `Page content ${newBinary.id}`
                }
            }];
            newPage.source = 'index.html';
            this.implementationGuide.page = newPage;
        } else if (!value && this.implementationGuide.page) {
            const foundPageDef = _.find(this.pages, (pageDef) => pageDef.page === this.implementationGuide.page);
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
        newBinary.content = btoa('No page content yet');
        newBinary.id = this.globals.generateRandomNumber(5000, 10000).toString();
        this.implementationGuide.contained.push(newBinary);

        const newPage = new PageComponent();
        newPage.kind = 'page';
        newPage.extension = [{
            url: this.globals.extensionIgPageContentUrl,
            valueReference: {
                reference: '#' + newBinary.id,
                display: `Page content ${newBinary.id}`
            }
        }];
        newPage.source = 'newPage.html';
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
        if (pageDef.page.source) {
            const parsedSourceUrl = this.globals.parseFhirUrl(pageDef.page.source);

            if (pageDef.page.source.startsWith('#')) {
                const foundBinary = _.find(this.implementationGuide.contained, (contained) =>
                    contained.id === pageDef.page.source.substring(1));

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
            delete this.implementationGuide.page;
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

    private initPage(page: PageComponent, level = 0, parent?: PageComponent) {
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

    private initPages() {
        this.pages = [];
        this.initPage(this.implementationGuide.page);
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

    ngOnDestroy() {
        this.navSubscription.unsubscribe();
    }

    ngDoCheck() {
        this.validation = this.fhirService.validate(this.implementationGuide);
    }
}
