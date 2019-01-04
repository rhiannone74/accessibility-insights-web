// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ApplicationBuildGenerator } from '../application-build-generator';
import { ChromeAdapter } from '../browser-adapter';
import { InstallDataGenerator } from '../install-data-generator';
import { title } from './../../content/strings/application';

export interface ApplicationTelemetryData {
    applicationVersion: string;
    applicationName: string;
    applicationBuild: string;
    installationId: string;
}

export class ApplicationTelemetryDataFactory {
    private readonly version: string;
    private readonly build: string;

    constructor(
        browserAdapter: ChromeAdapter,
        buildGenerator: ApplicationBuildGenerator,
        private readonly installDataGenerator: InstallDataGenerator) {
            const manifest = browserAdapter.getManifest();
            this.version = manifest.version;
            this.build = buildGenerator.getBuild();
    }

    public getData(): ApplicationTelemetryData {
       return {
        applicationVersion:  this.version,
        applicationName:  title,
        applicationBuild : this.build,
        installationId : this.installDataGenerator.getInstallationId(),
       };
    }
}
