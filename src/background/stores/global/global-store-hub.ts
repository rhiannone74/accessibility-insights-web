// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { BaseStore } from '../../../common/base-store';
import { IndexedDBAPI } from '../../../common/indexedDB/indexedDB';
import { StoreType } from '../../../common/types/store-type';
import { generateUID } from '../../../common/uid-generator';
import { GlobalActionHub } from '../../actions/global-action-hub';
import { BrowserAdapter } from '../../browser-adapter';
import { StorageAdapter } from '../../browser-adapters/storage-adapter';
import { PersistedData } from '../../get-persisted-data';
import { LocalStorageData } from '../../storage-data';
import { TelemetryEventHandler } from '../../telemetry/telemetry-event-handler';
import { StoreHub } from '../store-hub';
import { AssessmentsProvider } from './../../../assessments/types/assessments-provider';
import { AssessmentDataConverter } from './../../assessment-data-converter';
import { AssessmentDataRemover } from './../../assessment-data-remover';
import { InitialAssessmentStoreDataGenerator } from './../../initial-assessment-store-data-generator';
import { AssessmentStore } from './../assessment-store';
import { CommandStore } from './command-store';
import { FeatureFlagStore } from './feature-flag-store';
import { LaunchPanelStore } from './launch-panel-store';
import { ScopingStore } from './scoping-store';
import { UserConfigurationStore } from './user-configuration-store';

export class GlobalStoreHub implements StoreHub {
    public commandStore: CommandStore;
    public featureFlagStore: FeatureFlagStore;
    public launchPanelStore: LaunchPanelStore;
    public scopingStore: ScopingStore;
    public assessmentStore: AssessmentStore;
    public userConfigurationStore: UserConfigurationStore;

    constructor(
        globalActionHub: GlobalActionHub,
        telemetryEventHandler: TelemetryEventHandler,
        browserAdapter: BrowserAdapter,
        userData: LocalStorageData,
        assessmentsProvider: AssessmentsProvider,
        indexedDbInstance: IndexedDBAPI,
        persistedData: PersistedData,
        storageAdapter: StorageAdapter,
    ) {
        this.commandStore = new CommandStore(globalActionHub.commandActions, telemetryEventHandler);
        this.featureFlagStore = new FeatureFlagStore(globalActionHub.featureFlagActions, storageAdapter, userData);
        this.launchPanelStore = new LaunchPanelStore(globalActionHub.launchPanelStateActions, storageAdapter, userData);
        this.scopingStore = new ScopingStore(globalActionHub.scopingActions);
        this.assessmentStore = new AssessmentStore(
            browserAdapter,
            globalActionHub.assessmentActions,
            new AssessmentDataConverter(generateUID),
            new AssessmentDataRemover(),
            assessmentsProvider,
            indexedDbInstance,
            persistedData.assessmentStoreData,
            new InitialAssessmentStoreDataGenerator(assessmentsProvider.all()),
        );
        this.userConfigurationStore = new UserConfigurationStore(
            persistedData.userConfigurationData,
            globalActionHub.userConfigurationActions,
            indexedDbInstance,
        );
    }

    public initialize(): void {
        this.commandStore.initialize();
        this.featureFlagStore.initialize();
        this.launchPanelStore.initialize();
        this.scopingStore.initialize();
        this.assessmentStore.initialize();
        this.userConfigurationStore.initialize();
    }

    public getAllStores(): BaseStore<any>[] {
        return [
            this.commandStore,
            this.featureFlagStore,
            this.launchPanelStore,
            this.scopingStore,
            this.assessmentStore,
            this.userConfigurationStore,
        ];
    }

    public getStoreType(): StoreType {
        return StoreType.GlobalStore;
    }
}
