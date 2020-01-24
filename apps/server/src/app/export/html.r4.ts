import {HtmlExporter} from './html';
import {PageInfo} from './html.models';
import {Binary as R4Binary, ImplementationGuidePageComponent, ImplementationGuideResourceComponent} from '../../../../../libs/tof-lib/src/lib/r4/fhir';
import * as path from 'path';
import * as fs from 'fs-extra';
import {createTableFromArray, parseReference} from '../../../../../libs/tof-lib/src/lib/helper';
import {ContactDetail} from '../../../../../libs/tof-lib/src/lib/stu3/fhir';
import {Globals} from '../../../../../libs/tof-lib/src/lib/globals';
import {release} from 'os';
import {Formats} from '../models/export-options';

export class R4HtmlExporter extends HtmlExporter {
  /**
   * Removes Media resources from the implementation guide that are not an example.
   * Those Media resources are meant to be exported as images in the file
   * structure, rather than actual Media resources.
   */
  protected removeNonExampleMedia() {
    if (!this.r4ImplementationGuide.definition) {
      return;
    }

    const resourcesToRemove = (this.r4ImplementationGuide.definition.resource || []).filter(resource => {
      if (!resource.reference || !resource.reference.reference) {
        return false;
      }

      const parsed = parseReference(resource.reference.reference);
      return parsed.resourceType === 'Media' && !resource.exampleBoolean && !resource.exampleCanonical;
    });

    resourcesToRemove.forEach(resource => {
      const index = this.r4ImplementationGuide.definition.resource.indexOf(resource);
      this.r4ImplementationGuide.definition.resource.splice(index, index >= 0 ? 1 : 0);
    });
  }

  /* TODO: Uncomment after lloyd publishes his template changes
  public getControl(bundle: any, format: Formats) {
    return '[IG]\n' +
      `ig = input/${this.implementationGuideId}${HtmlExporter.getExtensionFromFormat(format)}\n` +
      'template = hl7.fhir.template\n' +
      'usage-stats-opt-out = false\n';
  }
   */

  protected getImplementationGuideResource(resourceType: string, id: string): ImplementationGuideResourceComponent {
    if (this.r4ImplementationGuide.definition) {
      const found = (this.r4ImplementationGuide.definition.resource || [])
        .find(res => res.reference && res.reference.reference === `${resourceType}/${id}`);
      return found;
    }
  }

  private writePage(pagesPath: string, page: ImplementationGuidePageComponent, level: number) {
    const pageInfo = this.pageInfos.find(next => next.page === page);
    const pageInfoIndex = this.pageInfos.indexOf(pageInfo);
    const previousPage = pageInfoIndex > 0 ? this.pageInfos[pageInfoIndex - 1] : null;
    const nextPage = pageInfoIndex < this.pageInfos.length - 1 ? this.pageInfos[pageInfoIndex + 1] : null;
    const fileName = pageInfo.fileName;

    const previousPageLink = previousPage && previousPage.finalFileName && previousPage.title ?
      `[Previous Page - ${previousPage.title}](${previousPage.finalFileName})\n\n` :
      undefined;
    const nextPageLink = nextPage && nextPage.finalFileName && nextPage.title ?
      `\n\n[Next Page - ${nextPage.title}](${nextPage.finalFileName})` :
      undefined;

    if (pageInfo.content && pageInfo.fileName) {
      const pagesPathFiles = fs.readdirSync(pagesPath);
      const foundExistingPage = pagesPathFiles.find(y => y.toLowerCase() === pageInfo.fileName.toLowerCase());

      if (foundExistingPage) {
        this.sendSocketMessage('progress', `Removing pre-existing framework/template file ${foundExistingPage} to be replaced by a narrative page in the IG.`);
        const removePagePath = path.join(pagesPath, foundExistingPage);
        fs.unlinkSync(removePagePath);
        pageInfo.fileName = foundExistingPage;
      }

      const newPagePath = path.join(pagesPath, fileName);

      fs.writeFileSync(newPagePath, `${previousPageLink || ''}${pageInfo.content}${nextPageLink || ''}`);
    }

    (page.page || []).forEach((subPage) => this.writePage(pagesPath, subPage, level + 1));
  }

  protected populatePageInfos() {
    // Flatten the hierarchy of pages into a single array that we can use to determine previous and next pages
    const getPagesList = (theList: PageInfo[], page: ImplementationGuidePageComponent) => {
      if (!page) {
        return theList;
      }

      const pageInfo = new PageInfo();
      pageInfo.page = page;

      if (page.nameReference && page.nameReference.reference) {
        const reference = page.nameReference.reference;

        if (reference.startsWith('#')) {
          const contained = (this.r4ImplementationGuide.contained || []).find((contained) => contained.id === reference.substring(1));
          const binary = contained && contained.resourceType === 'Binary' ? <R4Binary>contained : undefined;

          if (binary && binary.data) {
            pageInfo.fileName = Globals.getCleanFileName(page.title);

            if (pageInfo.fileName.indexOf('.') < 0) {
              pageInfo.fileName += this.getPageExtension(page);
            }
          }

          if (binary && binary.data) {
            pageInfo.content = Buffer.from(binary.data, 'base64').toString();
          }
        }
      } else if (page.nameUrl) {
        pageInfo.fileName = page.nameUrl;
      }

      theList.push(pageInfo);

      (page.page || []).forEach((next) => getPagesList(theList, next));

      return theList;
    };

    if (!this.r4ImplementationGuide.definition.page || this.r4ImplementationGuide.definition.page.nameUrl !== 'index.html') {
      const originalFirstPage = this.r4ImplementationGuide.definition.page;
      this.r4ImplementationGuide.definition.page = {
        title: 'IG Home Page',
        nameUrl: 'index.html',
        generation: 'markdown',
        page: originalFirstPage ? [originalFirstPage] : []
      };
    }

    this.pageInfos = getPagesList([], this.r4ImplementationGuide.definition ? this.r4ImplementationGuide.definition.page : null);
  }

  protected checkParameters() {
    super.checkParameters();

    // The copyrightyear and releaselabel parameters are required parameters for the IG Publisher
    let copyrightYearParam = this.r4ImplementationGuide.definition.parameter.find(p => p.code && p.code.toLowerCase() === 'copyrightyear');
    let releaseLabelParam = this.r4ImplementationGuide.definition.parameter.find(p => p.code && p.code.toLowerCase() === 'releaselabel');

    if (!copyrightYearParam) {
      copyrightYearParam = {
        code: 'copyrightyear',
        value: '2020+'
      };
      this.r4ImplementationGuide.definition.parameter.push(copyrightYearParam);
    }

    if (!releaseLabelParam) {
      releaseLabelParam = {
        code: 'releaselabel',
        value: 'CI Build'
      };
      this.r4ImplementationGuide.definition.parameter.push(releaseLabelParam);
    }
  }

  protected updateTemplates(rootPath: string, bundle) {
    if (!this.r4ImplementationGuide.definition) {
      this.r4ImplementationGuide.definition = {
        resource: []
      };
    }

    this.r4ImplementationGuide.definition.parameter = this.r4ImplementationGuide.definition.parameter || [];

    // always automatically create index.md, it might be overwritten by writePages()
    if (this.r4ImplementationGuide) {
      const pagesPath = path.join(rootPath, 'input/pagecontent');
      fs.ensureDirSync(pagesPath);

      const indexPath = path.join(pagesPath, 'index.md');

      fs.appendFileSync(indexPath, '<a name="intro"> </a>\n### Introduction\n\n');

      if (this.r4ImplementationGuide.description) {
        const descriptionContent = '### Description\n\n' + this.r4ImplementationGuide.description + '\n\n';
        fs.appendFileSync(indexPath, descriptionContent);
      } else {
        fs.appendFileSync(indexPath, 'This implementation guide does not have a description, yet.');
      }

      if (this.r4ImplementationGuide.contact) {
        const authorsData = (<any> this.r4ImplementationGuide.contact || []).map((contact: ContactDetail) => {
          const foundEmail = (contact.telecom || []).find((telecom) => telecom.system === 'email');
          return [contact.name, foundEmail ? `<a href="mailto:${foundEmail.value}">${foundEmail.value}</a>` : ''];
        });
        const authorsContent = '### Authors\n\n' + createTableFromArray(['Name', 'Email'], authorsData) + '\n\n';
        fs.appendFileSync(indexPath, authorsContent);
      }
    }

    super.updateTemplates(rootPath, bundle);
  }

  protected writePages(rootPath: string) {
    const pagesPath = path.join(rootPath, 'input/pagecontent');
    fs.ensureDirSync(pagesPath);

    this.writePage(pagesPath, this.r4ImplementationGuide.definition.page, 1);
  }
}
