// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { css } from '@uifabric/utilities';
import * as React from 'react';
// tslint:disable-next-line:no-require-imports
import BodyClassName = require('react-body-classname');

import { DefaultThemePalette } from '../styles/default-theme-palette';
import { HighContrastThemePalette } from '../styles/high-contrast-theme-palette';
import { UserConfigurationStoreData } from '../types/store-data/user-configuration-store';
import { withStoreSubscription, WithStoreSubscriptionDeps } from './with-store-subscription';

export interface ThemeInnerState {
    userConfigurationStoreData: UserConfigurationStoreData;
}
export type ThemeInnerProps = {
    deps: ThemeDeps;
    storeState?: ThemeInnerState;
};
export type ThemeDeps = WithStoreSubscriptionDeps<ThemeInnerState> & {
    loadTheme: (theme) => void;
};

export class ThemeInner extends React.Component<ThemeInnerProps> {
    public componentDidUpdate(prevProps): void {
        const enableHighContrastCurr = this.isHighContrastEnabled(this.props);
        const enableHighContrastPrev = this.isHighContrastEnabled(prevProps);
        if (enableHighContrastCurr === enableHighContrastPrev) {
            return;
        }
        this.props.deps.loadTheme({
            palette: enableHighContrastCurr ? HighContrastThemePalette : DefaultThemePalette,
        });
    }

    public render(): JSX.Element {
        const enableHighContrast = this.isHighContrastEnabled(this.props);
        const className = css('theme-switcher', enableHighContrast && 'high-contrast-theme');

        return <BodyClassName className={className} />;
    }

    private isHighContrastEnabled(props: ThemeInnerProps): boolean {
        const state = props.storeState.userConfigurationStoreData;
        return state && state.enableHighContrast;
    }
}

export const Theme = withStoreSubscription<ThemeInnerProps, ThemeInnerState>(ThemeInner);