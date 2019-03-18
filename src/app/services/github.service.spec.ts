import {TestBed} from '@angular/core/testing';

import {GithubService} from './github.service';
import {ConfigService} from './config.service';
import {HttpClientModule} from '@angular/common/http';

describe('GithubService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        providers: [GithubService, ConfigService],
        imports: [HttpClientModule]
    }));

    it('should be created', () => {
        const service: GithubService = TestBed.get(GithubService);
        expect(service).toBeTruthy();
    });
});
