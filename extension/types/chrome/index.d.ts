// Type definitions for Chrome extension APIs

interface Window {
  chrome: typeof chrome;
}

declare namespace chrome {
  export namespace runtime {
    export const lastError: chrome.runtime.LastError | undefined;
    export interface LastError {
      message?: string;
    }
    
    export function getURL(path: string): string;
    export function sendMessage<T = any, R = any>(message: T, responseCallback?: (response: R) => void): void;
    export function sendMessage<T = any, R = any>(extensionId: string, message: T, responseCallback?: (response: R) => void): void;
    export function sendMessage<T = any, R = any>(extensionId: string, message: T, options?: any, responseCallback?: (response: R) => void): void;
    
    export function onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => boolean | void): void;
      removeListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => boolean | void): void;
      hasListeners(): boolean;
    };
    
    export function onInstalled: {
      addListener(callback: (details: { reason: string; previousVersion?: string; id?: string }) => void): void;
      removeListener(callback: (details: { reason: string; previousVersion?: string; id?: string }) => void): void;
      hasListeners(): boolean;
    };
  }
  
  export namespace tabs {
    export interface Tab {
      id?: number;
      url?: string;
      title?: string;
      favIconUrl?: string;
      index: number;
      windowId: number;
      active: boolean;
      pinned: boolean;
      highlighted: boolean;
      audible?: boolean;
      discarded: boolean;
      autoDiscardable: boolean;
      mutedInfo?: { muted: boolean };
      width?: number;
      height?: number;
      status?: string;
      incognito: boolean;
      cookieStoreId?: string;
    }
    
    export function query(queryInfo: { active?: boolean; currentWindow?: boolean; url?: string | string[] }, callback: (result: Tab[]) => void): void;
    export function sendMessage(tabId: number, message: any, responseCallback?: (response: any) => void): void;
    export function executeScript(tabId: number, details: { file?: string; code?: string }, callback?: () => void): void;
  }
  
  export namespace storage {
    export interface StorageChange {
      oldValue?: any;
      newValue?: any;
    }
    
    export interface StorageChanges {
      [key: string]: StorageChange;
    }
    
    export interface StorageArea {
      get(keys?: string | string[] | object | null, callback?: (items: { [key: string]: any }) => void): void;
      set(items: object, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
    }
    
    export const local: StorageArea;
    export const sync: StorageArea;
    export const session: StorageArea;
    
    export function onChanged: {
      addListener(callback: (changes: StorageChanges, areaName: string) => void): void;
      removeListener(callback: (changes: StorageChanges, areaName: string) => void): void;
      hasListeners(): boolean;
    };
  }
  
  export namespace scripting {
    export interface InjectionTarget {
      tabId: number;
      allFrames?: boolean;
      frameIds?: number[];
    }
    
    export interface ScriptInjection {
      target: InjectionTarget;
      files?: string[];
      func?: Function;
      args?: any[];
      world?: string;
      injectImmediately?: boolean;
    }
    
    export function executeScript(injection: ScriptInjection, callback?: () => void): void;
  }
}