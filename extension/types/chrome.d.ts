// Type definitions for Chrome extension APIs

declare namespace chrome {
  export namespace runtime {
    export function getURL(path: string): string;
    export function getManifest(): any;
    export const id: string;

    export interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    export type MessageCallback = (
      message: any,
      sender: MessageSender,
      sendResponse: (response?: any) => void
    ) => void | boolean;

    export function sendMessage(
      message: any,
      responseCallback?: (response: any) => void
    ): void;
    export function sendMessage(
      extensionId: string,
      message: any,
      responseCallback?: (response: any) => void
    ): void;
    export function sendMessage(
      extensionId: string,
      message: any,
      options: any,
      responseCallback?: (response: any) => void
    ): void;

    export interface OnMessageEvent {
      addListener(callback: MessageCallback): void;
      removeListener(callback: MessageCallback): void;
      hasListener(callback: MessageCallback): boolean;
    }
    
    export const onMessage: OnMessageEvent;

    export interface InstalledDetails {
      reason: string;
      previousVersion?: string;
      id?: string;
    }

    export interface OnInstalledEvent {
      addListener(callback: (details: InstalledDetails) => void): void;
    }
    
    export const onInstalled: OnInstalledEvent;
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
      get(callback: (items: { [key: string]: any }) => void): void;
      get(keys: string | string[] | Object | null, callback: (items: { [key: string]: any }) => void): void;
      getBytesInUse(callback: (bytesInUse: number) => void): void;
      getBytesInUse(keys: string | string[] | null, callback: (bytesInUse: number) => void): void;
      set(items: Object, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
    }

    export interface SyncStorageArea extends StorageArea {
      // Some additional sync-specific methods could go here
    }

    export interface LocalStorageArea extends StorageArea {
      // Some additional local-specific methods could go here
    }

    export interface ManagedStorageArea extends StorageArea {
      // Some additional managed-specific methods could go here
    }

    export interface OnChangedEvent {
      addListener(callback: (changes: StorageChanges, areaName: string) => void): void;
    }
    
    export const onChanged: OnChangedEvent;

    export const sync: SyncStorageArea;
    export const local: LocalStorageArea;
    export const managed: ManagedStorageArea;
  }

  export namespace tabs {
    export interface Tab {
      id?: number;
      index: number;
      windowId: number;
      openerTabId?: number;
      highlighted: boolean;
      active: boolean;
      pinned: boolean;
      url?: string;
      title?: string;
      favIconUrl?: string;
      status?: string;
      incognito: boolean;
      width?: number;
      height?: number;
      sessionId?: string;
    }

    export function query(queryInfo: any, callback: (result: Tab[]) => void): void;
    export function create(createProperties: any, callback?: (tab: Tab) => void): void;
    export function executeScript(
      details: any,
      callback?: (result: any[]) => void
    ): void;
    export function sendMessage(
      tabId: number,
      message: any,
      responseCallback?: (response: any) => void
    ): void;
  }
}