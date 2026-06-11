/**
 * UpdateContext.js  —  src/update-screens/UpdateContext.js
 *
 * Stores update state for the session and exposes:
 *  - updateState / updateConfig  (read by SplashScreen)
 *  - softUpdateVisible / dismissSoftUpdate  (read by HomeScreen)
 *  - checkForUpdates()  (called by SplashScreen)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import UpdateService, { UPDATE_STATE } from './UpdateService';

const UpdateContext = createContext({
    updateState: UPDATE_STATE.NONE,
    updateConfig: null,
    softUpdateVisible: false,
    checkForUpdates: async () => ({ state: UPDATE_STATE.NONE, config: null }),
    dismissSoftUpdate: () => {},
});

export const useUpdate = () => {
    const context = useContext(UpdateContext);
    if (!context) throw new Error('useUpdate must be used within an UpdateProvider');
    return context;
};

export const UpdateProvider = ({ children }) => {
    const [updateState, setUpdateState]           = useState(UPDATE_STATE.NONE);
    const [updateConfig, setUpdateConfig]         = useState(null);
    const [softUpdateVisible, setSoftUpdateVisible] = useState(false);

    const checkForUpdates = useCallback(async () => {
        const result = await UpdateService.checkForUpdates();
        setUpdateState(result.state);
        setUpdateConfig(result.config);
        if (result.state === UPDATE_STATE.SOFT) setSoftUpdateVisible(true);
        return result;
    }, []);

    const dismissSoftUpdate = useCallback(() => setSoftUpdateVisible(false), []);

    return (
        <UpdateContext.Provider value={{
            updateState,
            updateConfig,
            softUpdateVisible,
            checkForUpdates,
            dismissSoftUpdate,
        }}>
            {children}
        </UpdateContext.Provider>
    );
};

export default UpdateContext;
