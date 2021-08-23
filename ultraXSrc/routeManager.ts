import express = require('express');
import ApiRoute from "./api/apiRoute";
import ApiRouteExecutor from "./api/apiRouteExecutor";
import fs from 'fs';
import path from 'path';

export default class RouteManager {

    private app: express.Application;
    private routes: ApiRoute[] = [];
    private workingRoutes: ApiRouteExecutor[] = []; 

    private _path: string;

    public get path(): string {
        return this._path;
    }

    constructor(app: express.Application, path?: string) {
        this.app = app;
        this._path = path;
        if (path && !fs.existsSync(path)) {
            throw new Error(`"${path}" is not a valid directory`);
        }
    }

    private scanDir(dirPath: string, namesToIgnore = ['tmp'], startDir = '') {
        if (!startDir) {
            startDir = dirPath;
        }
        const files: string[] = fs.readdirSync(dirPath);
    
        for (let file of files) {
            if (namesToIgnore.includes(file)) {
                continue;
            }
    
            const abs = path.join(dirPath, file);
    
            if (fs.lstatSync(abs).isDirectory()) {
                this.scanDir(abs, namesToIgnore, startDir);
            }
            else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const api: ApiRoute = require(abs);
                if (!api.route) {
                    const fileSplitted = file.split('.');
                    fileSplitted.pop();
                    api.route = `/${dirPath.replace(startDir, '').substring(1)}/${fileSplitted.join('.')}`
                }
                if (!api) {
                    console.log(`ERR: "${abs}" is not an ApiCall!`);
                }
                else {
                    this.routes.push(api);
                }
            }
        }
    }

    public scanRoutes() {
        if (!this._path) {
            return;
        }

        this.scanDir(this._path);
    }

    public startRoutes() {
        for (let route of this.routes) {
            console.log(`Starting: ${route.method.toUpperCase()}\t${route.route}`);
            this.workingRoutes.push(new ApiRouteExecutor(route, this.app));
        }
    }

}