/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UnifiedScreenState,
  UiNode,
  PopupState,
  TargetIdentity,
  TargetSource,
  RectBounds,
} from './types';

export class ScreenObservationEngine {
  private static currentForegroundPackage = 'com.android.chrome';
  private static currentForegroundActivity = 'MainActivity';
  private static screenHistory: UnifiedScreenState[] = [];

  public static setForegroundApp(pkg: string, activity?: string): void {
    this.currentForegroundPackage = pkg;
    if (activity) this.currentForegroundActivity = activity;
  }

  public static getForegroundPackage(): string {
    return this.currentForegroundPackage;
  }

  public static async captureScreenState(
    screenshotBase64?: string,
    simulatedNodes?: UiNode[]
  ): Promise<UnifiedScreenState> {
    const width = 1080;
    const height = 2400;

    // Build or gather nodes
    const nodes = simulatedNodes || this.synthesizeNodesForCurrentPackage();
    const visibleTexts = this.extractAllTexts(nodes);
    const clickableElements = this.filterClickable(nodes);
    const editableElements = this.filterEditable(nodes);
    const scrollableElements = this.filterScrollable(nodes);
    const popups = this.detectPopups(nodes);
    const loading = this.detectLoading(nodes, visibleTexts);

    const fingerprint = this.computeFingerprint(
      this.currentForegroundPackage,
      this.currentForegroundActivity,
      visibleTexts,
      nodes
    );

    const state: UnifiedScreenState = {
      packageName: this.currentForegroundPackage,
      activityName: this.currentForegroundActivity,
      width,
      height,
      nodes,
      visibleTexts,
      clickableElements,
      editableElements,
      scrollableElements,
      popups,
      loading,
      fingerprint,
      timestamp: Date.now(),
      screenshotBase64,
    };

    this.screenHistory.push(state);
    if (this.screenHistory.length > 20) {
      this.screenHistory.shift();
    }

    return state;
  }

  public static getLastScreenState(): UnifiedScreenState | null {
    return this.screenHistory.length > 0
      ? this.screenHistory[this.screenHistory.length - 1]
      : null;
  }

  public static hasScreenChanged(
    prevFingerprint?: string,
    currFingerprint?: string
  ): boolean {
    if (!prevFingerprint || !currFingerprint) return true;
    return prevFingerprint !== currFingerprint;
  }

  public static findTargetElement(
    screen: UnifiedScreenState,
    criteria: {
      text?: string;
      resourceId?: string;
      contentDescription?: string;
      semanticDescription?: string;
    }
  ): TargetIdentity | null {
    const targetText = criteria.text?.toLowerCase()?.trim();
    const targetResId = criteria.resourceId?.toLowerCase()?.trim();
    const targetDesc = (
      criteria.contentDescription || criteria.semanticDescription
    )
      ?.toLowerCase()
      ?.trim();

    // 1. Exact or partial Resource ID match
    if (targetResId) {
      const match = screen.nodes.find(
        (n) => n.resourceId?.toLowerCase() === targetResId
      );
      if (match) {
        return {
          semanticDescription: match.text || match.resourceId || 'UI Element',
          resourceId: match.resourceId,
          text: match.text,
          contentDescription: match.contentDescription,
          bounds: match.bounds,
          confidence: 0.98,
          source: 'ACCESSIBILITY_ID',
        };
      }
    }

    // 2. Exact or substring Text match
    if (targetText) {
      const exactMatch = screen.nodes.find(
        (n) => n.text && n.text.toLowerCase() === targetText
      );
      if (exactMatch) {
        return {
          semanticDescription: exactMatch.text || 'Text Element',
          resourceId: exactMatch.resourceId,
          text: exactMatch.text,
          contentDescription: exactMatch.contentDescription,
          bounds: exactMatch.bounds,
          confidence: 0.95,
          source: 'TEXT',
        };
      }

      const partialMatch = screen.nodes.find(
        (n) => n.text && n.text.toLowerCase().includes(targetText)
      );
      if (partialMatch) {
        return {
          semanticDescription: partialMatch.text || 'Partial Text Element',
          resourceId: partialMatch.resourceId,
          text: partialMatch.text,
          contentDescription: partialMatch.contentDescription,
          bounds: partialMatch.bounds,
          confidence: 0.88,
          source: 'TEXT',
        };
      }
    }

    // 3. Content Description match
    if (targetDesc) {
      const descMatch = screen.nodes.find(
        (n) =>
          n.contentDescription &&
          n.contentDescription.toLowerCase().includes(targetDesc)
      );
      if (descMatch) {
        return {
          semanticDescription: descMatch.contentDescription || 'Described Element',
          resourceId: descMatch.resourceId,
          text: descMatch.text,
          contentDescription: descMatch.contentDescription,
          bounds: descMatch.bounds,
          confidence: 0.92,
          source: 'CONTENT_DESCRIPTION',
        };
      }
    }

    // 4. Semantic match across all visible clickable/editable elements
    if (targetDesc || targetText) {
      const searchKey = targetDesc || targetText || '';
      for (const el of [...screen.editableElements, ...screen.clickableElements]) {
        const combined = `${el.text || ''} ${el.contentDescription || ''} ${
          el.resourceId || ''
        }`.toLowerCase();
        if (
          combined.includes('search') ||
          combined.includes('খুঁজুন') ||
          combined.includes('input') ||
          combined.includes('address') ||
          combined.includes(searchKey)
        ) {
          return {
            semanticDescription: el.text || el.contentDescription || 'Search/Input Box',
            resourceId: el.resourceId,
            text: el.text,
            contentDescription: el.contentDescription,
            bounds: el.bounds,
            confidence: 0.78,
            source: 'SEMANTIC_MATCH',
          };
        }
      }
    }

    // Fallback: Return center search or default interaction coordinate
    if (screen.editableElements.length > 0) {
      const firstInput = screen.editableElements[0];
      return {
        semanticDescription: firstInput.text || 'Primary Editable Field',
        resourceId: firstInput.resourceId,
        text: firstInput.text,
        contentDescription: firstInput.contentDescription,
        bounds: firstInput.bounds,
        confidence: 0.65,
        source: 'COORDINATE_FALLBACK',
      };
    }

    return null;
  }

  private static computeFingerprint(
    pkg: string,
    act: string,
    texts: string[],
    nodes: UiNode[]
  ): string {
    const raw = `${pkg}|${act}|${texts.slice(0, 10).join(';')}|${nodes.length}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `fp_${Math.abs(hash).toString(16)}`;
  }

  private static extractAllTexts(nodes: UiNode[]): string[] {
    const texts: string[] = [];
    const traverse = (list: UiNode[]) => {
      for (const n of list) {
        if (n.text && n.text.trim()) texts.push(n.text.trim());
        if (n.contentDescription && n.contentDescription.trim())
          texts.push(n.contentDescription.trim());
        if (n.children) traverse(n.children);
      }
    };
    traverse(nodes);
    return texts;
  }

  private static filterClickable(nodes: UiNode[]): UiNode[] {
    return nodes.filter((n) => n.isClickable && n.isVisible);
  }

  private static filterEditable(nodes: UiNode[]): UiNode[] {
    return nodes.filter((n) => n.isEditable && n.isVisible);
  }

  private static filterScrollable(nodes: UiNode[]): UiNode[] {
    return nodes.filter((n) => n.isScrollable && n.isVisible);
  }

  private static detectPopups(nodes: UiNode[]): PopupState[] {
    const popups: PopupState[] = [];
    for (const n of nodes) {
      const txt = (n.text || n.contentDescription || '').toLowerCase();
      if (
        txt.includes('accept cookies') ||
        txt.includes('কুকিজ গ্রহণ করুন') ||
        txt.includes('allow permission') ||
        txt.includes('অনুমতি দিন')
      ) {
        popups.push({
          detected: true,
          type: txt.includes('permission') ? 'permission' : 'cookie',
          title: n.text,
          dismissButtonId: n.id,
        });
      }
    }
    return popups;
  }

  private static detectLoading(nodes: UiNode[], texts: string[]): boolean {
    return texts.some(
      (t) =>
        t.toLowerCase().includes('loading') ||
        t.toLowerCase().includes('অপেক্ষা করুন') ||
        t.toLowerCase().includes('লোড হচ্ছে')
    );
  }

  private static synthesizeNodesForCurrentPackage(): UiNode[] {
    const pkg = this.currentForegroundPackage;
    if (pkg.includes('chrome') || pkg.includes('browser')) {
      return [
        {
          id: 'node_url_bar',
          resourceId: 'com.android.chrome:id/url_bar',
          className: 'android.widget.EditText',
          packageName: pkg,
          text: 'google.com',
          contentDescription: 'Search or type URL',
          bounds: { left: 80, top: 120, right: 1000, bottom: 220, width: 920, height: 100 },
          isClickable: true,
          isEditable: true,
          isScrollable: false,
          isFocused: true,
          isVisible: true,
        },
        {
          id: 'node_google_search_box',
          resourceId: 'com.android.chrome:id/search_query',
          className: 'android.widget.EditText',
          packageName: pkg,
          text: '',
          contentDescription: 'Google Search input',
          bounds: { left: 100, top: 600, right: 980, bottom: 720, width: 880, height: 120 },
          isClickable: true,
          isEditable: true,
          isScrollable: false,
          isFocused: false,
          isVisible: true,
        },
        {
          id: 'node_youtube_result_1',
          resourceId: 'com.android.chrome:id/search_result_title',
          className: 'android.widget.TextView',
          packageName: pkg,
          text: 'YouTube - Home',
          contentDescription: 'YouTube Official Link',
          bounds: { left: 100, top: 900, right: 980, bottom: 1050, width: 880, height: 150 },
          isClickable: true,
          isEditable: false,
          isScrollable: false,
          isFocused: false,
          isVisible: true,
        },
      ];
    }

    if (pkg.includes('youtube')) {
      return [
        {
          id: 'node_yt_search',
          resourceId: 'com.google.android.youtube:id/search_button',
          className: 'android.widget.ImageView',
          packageName: pkg,
          contentDescription: 'Search YouTube',
          bounds: { left: 880, top: 100, right: 980, bottom: 200, width: 100, height: 100 },
          isClickable: true,
          isEditable: false,
          isScrollable: false,
          isFocused: false,
          isVisible: true,
        },
        {
          id: 'node_yt_first_video',
          resourceId: 'com.google.android.youtube:id/video_title',
          className: 'android.widget.TextView',
          packageName: pkg,
          text: 'Bengali Melody Classics - সেরা গান',
          bounds: { left: 60, top: 400, right: 1020, bottom: 750, width: 960, height: 350 },
          isClickable: true,
          isEditable: false,
          isScrollable: false,
          isFocused: false,
          isVisible: true,
        },
      ];
    }

    // Default Android system nodes
    return [
      {
        id: 'node_home_app_icon_chrome',
        resourceId: 'com.google.android.apps.nexuslauncher:id/icon_chrome',
        className: 'android.widget.TextView',
        packageName: 'com.android.launcher',
        text: 'Chrome',
        contentDescription: 'Open Chrome Browser',
        bounds: { left: 120, top: 1800, right: 280, bottom: 1960, width: 160, height: 160 },
        isClickable: true,
        isEditable: false,
        isScrollable: false,
        isFocused: false,
        isVisible: true,
      },
      {
        id: 'node_home_app_icon_youtube',
        resourceId: 'com.google.android.apps.nexuslauncher:id/icon_youtube',
        className: 'android.widget.TextView',
        packageName: 'com.android.launcher',
        text: 'YouTube',
        contentDescription: 'Open YouTube',
        bounds: { left: 360, top: 1800, right: 520, bottom: 1960, width: 160, height: 160 },
        isClickable: true,
        isEditable: false,
        isScrollable: false,
        isFocused: false,
        isVisible: true,
      },
    ];
  }
}
