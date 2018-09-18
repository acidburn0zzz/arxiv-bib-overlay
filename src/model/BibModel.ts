import { action, observable } from 'mobx'
import { AdsDatasource } from '../api/AdsDatasource'
import { DataSource, Paper, PaperGroup } from '../api/document'
import { InspireDatasource } from '../api/InspireDatasource'
import { S2Datasource } from '../api/S2Datasource'
import { get_categories, get_current_article } from '../arxiv_page'
import { state, Status } from './State'

export class BibModel {
    arxivId: string = ''
    categories: string[][]

    @observable
    allDS: DataSource[] = [
        new InspireDatasource(),
        new AdsDatasource(),
        new S2Datasource()
    ]

    @observable
    availableDS: DataSource[]

    @observable
    currentDS: DataSource

    @observable
    paper: Paper

    @observable
    citations: PaperGroup

    @observable
    references: PaperGroup

    @action
    setDS(dataSource: DataSource): void {
        state.state = Status.LOADING
        this.currentDS = dataSource
        this.currentDS.fetch_all(this.arxivId)
            .then(ds => this.populateFromDSResult(ds))
            .catch(error => this.populateFromDSError(error))
    }

    @action
    configureFromAbtract() {
        const arxivid: string = get_current_article()
        const categories: string[][] = get_categories()
        this.configureSources(arxivid, categories)
    }

    @action
    configureSources(arxivId: string, categories: string[][]): void {
        const primary = categories[0][0]
        this.arxivId = arxivId
        this.categories = categories

        this.availableDS = this.allDS.filter((ds) => ds.categories.has(primary))
        this.setDS(this.availableDS[0])
    }

    @action
    reconfigureSources(): void {
        if (!this.currentDS) {
            this.configureFromAbtract()
        } else {
            this.setDS(this.currentDS)
        }
    }

    @action
    populateFromDSResult(ds: DataSource): void {
        state.state = Status.LOADED

        this.paper = ds.data
        if (ds.data.citations) {
            this.citations = ds.data.citations
        }
        if (ds.data.references) {
            this.references = ds.data.references
        }
    }

    @action
    populateFromDSError(error: Error): void {
        state.error(error.message)
    }
}
