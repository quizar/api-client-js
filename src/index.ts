
require('es6-promise').polyfill();
require('isomorphic-fetch');

export type Index<T> = {
    [index: string]: T
}

export type QueryItem = {
    name: string,
    fields: string,
    outName?: string,
    variables?: { type?: string, name: string, value: any, varName?: string }[]
}

export type QueryItemInput = {
    name: string,
    fields: string
}

export type RequestResult = {
    data: Index<any>,
    error?: Error[]
}

export type GraphQLQueryData = {
    query: string
    variables: Index<any>
}

export class QueryExecutor {
    constructor(private url, private headers: Index<string> = { 'Content-Type': 'application/json' }) { }

    execute(data: GraphQLQueryData): Promise<Response> {
        // console.log('executing url', this.url);
        // console.log('executing data', data);
        return fetch(this.url, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data),
            mode: 'cors',
            cache: 'default'
        });
    }
}

export class BaseQuery {
    private items: QueryItem[] = [];

    constructor(private executor: QueryExecutor, private type: 'query' | 'mutation') { }

    protected addQueryItem(item: QueryItem) {
        this.items.push(item);
        return this;
    }

    formatQueryData(): GraphQLQueryData {
        const variables: Index<any> = {};
        let query: string = this.type + ' queryName';
        const queryParams: Index<any> = {};
        let varCount = 0;
        const body = this.items.map(item => {
            let body = (item.outName || item.name) + ':' + item.name;
            if (item.variables) {
                item.variables.forEach(v => {
                    v.varName = '$input' + varCount;
                    queryParams[v.varName] = v.type || 'String!';
                    variables[v.varName.substr(1)] = v.value;
                    varCount++;
                });
                body += '(' + item.variables.map(v => v.name + ':' + v.varName).join(', ') + ')';
            }
            return body + '{' + item.fields + '}';
        }).join(',');

        if (Object.keys(queryParams).length) {
            query += '(' + Object.keys(queryParams).map(key => key + ':' + queryParams[key]).join(',') + ')';
        }

        query += '{' + body + '}';

        return { query, variables };
    }

    execute() {
        const queryData = this.formatQueryData();
        return this.executor.execute(queryData);
    }
}

export class MutationApi extends BaseQuery {
    quizItemCreate<QIT>(item: QueryItemInput, data: QIT): MutationApi {
        return this.addQueryItem({ fields: item.fields, name: 'quizItemCreate', outName: item.name, variables: [{ type: 'InputQuizItem!', name: 'data', value: data }] });
    }
    quizItemUpdate<QIT>(item: QueryItemInput, data: QIT): MutationApi {
        return this.addQueryItem({ fields: item.fields, name: 'quizItemUpdate', outName: item.name, variables: [{ type: 'InputQuizItem!', name: 'data', value: data }] });
    }
    quizCreate<QT>(item: QueryItemInput, data: QT): MutationApi {
        return this.addQueryItem({ fields: item.fields, name: 'quizCreate', outName: item.name, variables: [{ type: 'InputQuiz!', name: 'data', value: data }] });
    }
    quizUpdate<QT>(item: QueryItemInput, data: QT): MutationApi {
        return this.addQueryItem({ fields: item.fields, name: 'quizUpdate', outName: item.name, variables: [{ type: 'InputQuiz!', name: 'data', value: data }] });
    }
    quizAddQuizItemInfo<QIIT>(item: QueryItemInput, quizId: string, data: QIIT): MutationApi {
        return this.addQueryItem({ fields: item.fields, name: 'quizAddQuizItemInfo', outName: item.name, variables: [{ name: 'quizId', value: quizId }, { type: 'InputQuizItemInfo', name: 'data', value: data }] });
    }
    quizRemoveQuizItemInfo(item: QueryItemInput, quizId: string, quizItemId: string): MutationApi {
        return this.addQueryItem({ fields: item.fields, name: 'quizRemoveQuizItemInfo', outName: item.name, variables: [{ name: 'quizId', value: quizId }, { name: 'quizItemId', value: quizItemId }] });
    }
}

export class QueryApi extends BaseQuery {
    quizItemGetById(item: QueryItemInput, id: string): QueryApi {
        return this.addQueryItem({ fields: item.fields, name: 'quizItemGetById', outName: item.name, variables: [{ name: 'id', value: id }] });
    }
    quizGetById(item: QueryItemInput, id: string): QueryApi {
        return this.addQueryItem({ fields: item.fields, name: 'quizGetById', outName: item.name, variables: [{ name: 'id', value: id }] });
    }
    entityGetById(item: QueryItemInput, id: string): QueryApi {
        return this.addQueryItem({ fields: item.fields, name: 'entityGetById', outName: item.name, variables: [{ name: 'id', value: id }] });
    }
}

export class ApiClient {
    readonly mutation: MutationApi;
    readonly query: QueryApi;
    constructor(url: string, headers?: Index<string>) {
        this.mutation = new MutationApi(new QueryExecutor(url, headers), 'mutation');
        this.query = new QueryApi(new QueryExecutor(url, headers), 'query');
    }
}
