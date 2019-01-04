// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AssessmentDataRemover } from '../../../background/assessment-data-remover';
import { IGeneratedAssessmentInstance, ITestStepResult } from '../../../common/types/store-data/iassessment-result-data';


describe('AssessmentDataRemoverTest', () => {
    const instanceKey = 'instance-key-1';
    let selectedStep = 'selectedStep';
    let anotherStep = 'anotherStep';

    test('deleteDataFromGeneratedMapWithStepKey: only delete one test step result entry', () => {
        const instanceMap = getInstanceMapWitMultipleTestStepResults();
        new AssessmentDataRemover().deleteDataFromGeneratedMapWithStepKey(instanceMap, selectedStep);
        expect(instanceMap[instanceKey].testStepResults[anotherStep]).toBeDefined();
    });

    test('deleteDataFromGeneratedMapWithStepKey: delete the instance in the instance map', () => {
        const instanceMap = getInstanceMapWithOnlyOneTestStepResult();
        new AssessmentDataRemover().deleteDataFromGeneratedMapWithStepKey(instanceMap, selectedStep);
        expect(instanceMap[instanceKey]).toBeUndefined();
    });

    function getInstanceMapWithOnlyOneTestStepResult(): IDictionaryStringTo<IGeneratedAssessmentInstance> {
        return {
            [instanceKey]: {
                testStepResults: {
                    [selectedStep]: {
                        status: 2,
                    } as ITestStepResult,
                },
            } as IGeneratedAssessmentInstance,
        };
    }

    function getInstanceMapWitMultipleTestStepResults(): IDictionaryStringTo<IGeneratedAssessmentInstance> {
        return {
            [instanceKey]: {
                testStepResults: {
                    [selectedStep]: {
                        status: 2,
                    } as ITestStepResult,
                    [anotherStep]: {
                        status: 1,
                    } as ITestStepResult,
                },
            } as IGeneratedAssessmentInstance,
        };
    }
});
