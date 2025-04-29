import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import hbs from 'hbs'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
dotenv.config({ path: './.env' });

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('view engine', 'hbs');

hbs.registerHelper('ifCond', function(v1, v2, options) {
    if (v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

const routeDir = join(__dirname, 'routes');
const routeFiles = readdirSync(routeDir);

for (const file of routeFiles) {
    const routePath = `/${file.replace('.js', '')}`;
    const fileUrl = pathToFileURL(join(routeDir, file)); 
    const route = await import(fileUrl);
    app.use(routePath === '/index' ? '/' : routePath, route.default);
}

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/');
});
