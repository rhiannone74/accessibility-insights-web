// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
/// <reference path="./iformatter.d.ts" />
/// <reference path="./../client-utils.ts" />
import { ClientUtils } from '../client-utils';
import { AxeResultsWithFrameLevel, IAssessmentVisualizationInstance } from '../frameCommunicators/html-element-axe-results-helper';
import { IDrawerConfiguration, IFormatter } from './iformatter';
import { FailureInstanceFormatter } from './failure-instance-formatter';


export interface IHeadingStyleConfiguration {
    borderColor: string;
    fontColor: string;
}

export interface IStyleComputer {
    getComputedStyle(elt: Element, pseudoElt?: string): CSSStyleDeclaration;
}

export class HeadingFormatter extends FailureInstanceFormatter {

    private styleComputer: IStyleComputer;
    private clientUtils: ClientUtils;

    constructor(styleComputer: IStyleComputer, clientUtils: ClientUtils) {
        super();
        this.styleComputer = styleComputer;
        this.clientUtils = clientUtils;
    }

    public static headingStyles: { [level: string]: IHeadingStyleConfiguration } = {
        '1': {
            borderColor: '#0066CC',
            fontColor: '#FFFFFF',
        },
        '2': {
            borderColor: '#CC0099',
            fontColor: '#FFFFFF',
        },
        '3': {
            borderColor: '#008000',
            fontColor: '#FFFFFF',
        },
        '4': {
            borderColor: '#6600CC',
            fontColor: '#FFFFFF',
        },
        '5': {
            borderColor: '#008080',
            fontColor: '#FFFFFF',
        },
        '6': {
            borderColor: '#996633',
            fontColor: '#FFFFFF',
        },
        'blank': {
            borderColor: '#C00000',
            fontColor: '#FFFFFF',
        },
    };

    public getDialogRenderer() { return null; }

    public getDrawerConfiguration(element: HTMLElement, data: IAssessmentVisualizationInstance): IDrawerConfiguration {
        const level = this.isHTag(element) ? this.getHTagLevel(element) : this.getAriaLevel(element);
        const text = (this.isHTag(element) ? 'H' : 'h') + level;
        const style = HeadingFormatter.headingStyles[level] || HeadingFormatter.headingStyles.blank;

        const drawerConfig: IDrawerConfiguration = {
            textBoxConfig: {
                fontColor: style.fontColor,
                text,
                background: style.borderColor,
            },
            borderColor: style.borderColor,
            outlineStyle: 'solid',
            showVisualization: true,
            textAlign: 'center',
        };

        if (!element.innerText) {
            drawerConfig.showVisualization = false;
        }

        if (data && data.isVisualizationEnabled != null && !data.isVisualizationEnabled) {
            drawerConfig.showVisualization = false;
        }

        if (this.getAttribute(element, 'aria-hidden') === 'true') {
            drawerConfig.showVisualization = false;
        }

        const compStyle = this.styleComputer.getComputedStyle(element);
        if (compStyle.display === 'none') {
            drawerConfig.showVisualization = false;
        }

        drawerConfig.failureBoxConfig = this.getFailureBoxConfig(data);

        return drawerConfig;
    }

    private isHTag(element: HTMLElement): boolean {
        return this.clientUtils.matchesSelector(element, 'h1,h2,h3,h4,h5,h6');
    }

    private getHTagLevel(element: HTMLElement): string {
        const headingLevel = element.tagName.toLowerCase().match(/h(\d)/);
        return headingLevel ? headingLevel[1] : null;
    }

    private getAriaLevel(element: HTMLElement): string {
        const attr = element.attributes.getNamedItem('aria-level');
        return attr ? attr.textContent : '-';
    }

    private getAttribute(element: HTMLElement, attrName: string): string {
        const attr = element.attributes.getNamedItem(attrName);
        return attr ? attr.textContent : null;
    }
}
