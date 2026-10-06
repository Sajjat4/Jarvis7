/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskStep, UnifiedScreenState } from './types';
import { UniversalCommunicationController } from './communication/universalCommunicationController';

export class TaskPlanner {
  public static async createPlan(
    originalGoal: string,
    initialScreen: UnifiedScreenState
  ): Promise<TaskStep[]> {
    const lower = originalGoal.toLowerCase();

    // 1. Universal Communication Tasks (WhatsApp, Messenger, Telegram, Signal)
    const commIntent =
      UniversalCommunicationController.getInstance().parseCommunicationIntent(
        originalGoal
      );

    if (commIntent) {
      const appName =
        commIntent.app === 'whatsapp'
          ? 'WhatsApp'
          : commIntent.app === 'messenger'
          ? 'Messenger'
          : commIntent.app === 'telegram'
          ? 'Telegram'
          : commIntent.app === 'signal'
          ? 'Signal'
          : 'Messages';

      const pkg =
        commIntent.app === 'whatsapp'
          ? 'com.whatsapp'
          : commIntent.app === 'messenger'
          ? 'com.facebook.orca'
          : commIntent.app === 'telegram'
          ? 'org.telegram.messenger'
          : commIntent.app === 'signal'
          ? 'org.thoughtcrime.securesms'
          : 'com.google.android.apps.messaging';

      const contact = commIntent.contactName || 'Contact';

      // 1.1 Send Message Workflow
      if (commIntent.action === 'SEND_MESSAGE') {
        const msg = commIntent.message || 'হ্যালো';
        return [
          {
            id: 'comm_step_1_open_app',
            title: `${appName} খোলা`,
            actionType: 'open_app',
            params: { appName, packageName: pkg },
            targetDescription: `${appName} Application`,
            status: 'pending',
            expectedOutcome: `${appName} ইন্টারফেস স্ক্রিনে প্রদর্শিত হবে`,
            retryCount: 0,
          },
          {
            id: 'comm_step_2_search_contact',
            title: `কন্টাক্ট "${contact}" অনুসন্ধান`,
            actionType: 'type_text',
            params: { text: contact },
            targetDescription: 'Search Bar / Contact search',
            status: 'pending',
            expectedOutcome: `"${contact}" এর চ্যাট তালিকা ফিল্টার হবে`,
            retryCount: 0,
          },
          {
            id: 'comm_step_3_open_chat',
            title: `"${contact}"-এর চ্যাট ওপেন করা`,
            actionType: 'click',
            params: { text: contact },
            targetDescription: `${contact} Chat Item`,
            status: 'pending',
            expectedOutcome: 'ইনবক্স/মেসেজ ডায়ালগ ওপেন হবে',
            retryCount: 0,
          },
          {
            id: 'comm_step_4_type_message',
            title: `মেসেজ টাইপ করা: "${msg}"`,
            actionType: 'type_text',
            params: { text: msg },
            targetDescription: 'Message Input Box',
            status: 'pending',
            expectedOutcome: `ইনপুটে "${msg}" লিখিত হবে`,
            retryCount: 0,
          },
          {
            id: 'comm_step_5_send_and_verify',
            title: 'মেসেজ প্রেরণ ও নিশ্চিতকরণ',
            actionType: 'press_key',
            params: { key: 'Enter' },
            targetDescription: 'Send Button',
            status: 'pending',
            expectedOutcome: 'মেসেজ প্রেরিত হয়েছে এবং আউটিং বাবলে দৃশ্যমান হবে',
            retryCount: 0,
          },
        ];
      }

      // 1.2 Audio / Video Call Workflow
      if (
        commIntent.action === 'START_AUDIO_CALL' ||
        commIntent.action === 'START_VIDEO_CALL'
      ) {
        const isVideo = commIntent.action === 'START_VIDEO_CALL';
        return [
          {
            id: 'comm_call_step_1_open_app',
            title: `${appName} চালু করা`,
            actionType: 'open_app',
            params: { appName, packageName: pkg },
            targetDescription: `${appName} Application`,
            status: 'pending',
            expectedOutcome: `${appName} স্ক্রিন প্রদর্শিত হবে`,
            retryCount: 0,
          },
          {
            id: 'comm_call_step_2_open_chat',
            title: `"${contact}"-এর প্রোফাইল/চ্যাট খোলা`,
            actionType: 'click',
            params: { text: contact },
            targetDescription: `${contact} Profile`,
            status: 'pending',
            expectedOutcome: 'কল বাটনসমূহ দৃশ্যমান হবে',
            retryCount: 0,
          },
          {
            id: 'comm_call_step_3_trigger_call',
            title: `"${contact}"-কে ${isVideo ? 'ভিডিও' : 'অডিও'} কল শুরু করা`,
            actionType: 'click',
            params: { text: isVideo ? 'Video call' : 'Voice call' },
            targetDescription: isVideo ? 'Video Call Button' : 'Audio Call Button',
            status: 'pending',
            expectedOutcome: 'কল ডায়ালিং স্ক্রিন সক্রিয় হবে',
            retryCount: 0,
          },
        ];
      }
    }

    // 2. Chrome + Google Search + YouTube workflow (Exact test scenario)
    if (
      (lower.includes('chrome') || lower.includes('google')) &&
      lower.includes('youtube') &&
      (lower.includes('search') || lower.includes('খুলে') || lower.includes('গিয়ে'))
    ) {
      return [
        {
          id: 'step_1_open_chrome',
          title: 'Chrome ব্রাউজার খোলা',
          actionType: 'open_app',
          params: { appName: 'Chrome', packageName: 'com.android.chrome' },
          targetDescription: 'Chrome ব্রাউজার অ্যাপ',
          status: 'pending',
          expectedOutcome: 'Chrome ব্রাউজার স্ক্রিন প্রদর্শিত হবে',
          retryCount: 0,
        },
        {
          id: 'step_2_inspect_address_bar',
          title: 'অ্যাড্রেস/সার্চ বার শনাক্তকরণ',
          actionType: 'click',
          targetDescription: 'Search or type URL bar',
          params: { text: 'google.com', resourceId: 'com.android.chrome:id/url_bar' },
          status: 'pending',
          expectedOutcome: 'অ্যাড্রেস বারে ফোকাস সেট হবে',
          retryCount: 0,
        },
        {
          id: 'step_3_navigate_google',
          title: 'Google-এ নেভিগেট ও লোড',
          actionType: 'type_text',
          params: { text: 'google.com' },
          targetDescription: 'URL ইনপুট',
          status: 'pending',
          expectedOutcome: 'Google সার্চ হোমপেজ লোড হবে',
          retryCount: 0,
        },
        {
          id: 'step_4_submit_google_url',
          title: 'পেজ লোড সম্পন্ন ও যাচাই',
          actionType: 'press_key',
          params: { key: 'Enter' },
          targetDescription: 'Enter / Go key',
          status: 'pending',
          expectedOutcome: 'Google সার্চ ইন্টারফেস দৃশ্যমান হবে',
          retryCount: 0,
        },
        {
          id: 'step_5_find_google_search_box',
          title: 'Google সার্চ বক্সে "YouTube" টাইপ করা',
          actionType: 'type_text',
          params: { text: 'YouTube' },
          targetDescription: 'Google Search input field',
          status: 'pending',
          expectedOutcome: 'সার্চ ফিল্ডে "YouTube" লিখিত হবে',
          retryCount: 0,
        },
        {
          id: 'step_6_submit_search',
          title: 'সার্চ সাবমিট ও ফলাফল প্রাপ্তি',
          actionType: 'press_key',
          params: { key: 'Enter' },
          targetDescription: 'Search submit',
          status: 'pending',
          expectedOutcome: 'YouTube সার্চ ফলাফলের তালিকা স্ক্রিনে আসবে',
          retryCount: 0,
        },
        {
          id: 'step_7_verify_and_open_result',
          title: 'YouTube ফলাফল যাচাই ও নিশ্চিতকরণ',
          actionType: 'click',
          targetDescription: 'YouTube Official Search Result',
          params: { text: 'YouTube' },
          status: 'pending',
          expectedOutcome: 'YouTube সফলভাবে অনুসন্ধান সম্পন্ন হবে',
          retryCount: 0,
        },
      ];
    }

    // 3. Generic YouTube search & play
    if (
      lower.includes('youtube') &&
      (lower.includes('play') || lower.includes('গান') || lower.includes('ভিডিও'))
    ) {
      const query =
        originalGoal
          .replace(/(youtube|ইউটিউব|প্লে করো|গান|বাজাও)/gi, '')
          .trim() || 'বাংলা গান';
      return [
        {
          id: 'step_1_open_yt',
          title: 'YouTube অ্যাপ চালু করা',
          actionType: 'open_app',
          params: { appName: 'YouTube', packageName: 'com.google.android.youtube' },
          targetDescription: 'YouTube অ্যাপ',
          status: 'pending',
          expectedOutcome: 'YouTube হোম স্ক্রিন ওপেন হবে',
          retryCount: 0,
        },
        {
          id: 'step_2_search_yt',
          title: `"${query}" লিখে সার্চ করা`,
          actionType: 'type_text',
          params: { text: query },
          targetDescription: 'YouTube Search Bar',
          status: 'pending',
          expectedOutcome: `"${query}" এর ভিডিও তালিকা প্রদর্শিত হবে`,
          retryCount: 0,
        },
        {
          id: 'step_3_click_video',
          title: 'প্রথম প্রাসঙ্গিক ভিডিও প্লে করা',
          actionType: 'click',
          targetDescription: 'First Video Card',
          params: { text: query },
          status: 'pending',
          expectedOutcome: 'ভিডিও প্লেব্যাক শুরু হবে',
          retryCount: 0,
        },
      ];
    }

    // 4. Calculator & Tool Launching
    if (lower.includes('ক্যালকুলেটর') || lower.includes('calculator')) {
      return [
        {
          id: 'step_1_open_calc',
          title: 'ক্যালকুলেটর চালু করা',
          actionType: 'open_app',
          params: {
            appName: 'Calculator',
            packageName: 'com.google.android.calculator',
          },
          targetDescription: 'Calculator App',
          status: 'pending',
          expectedOutcome: 'ক্যালকুলেটর ইন্টারফেস দৃশ্যমান হবে',
          retryCount: 0,
        },
      ];
    }

    // Default Dynamic Single-step action
    return [
      {
        id: 'step_1_inspect_and_act',
        title: `${originalGoal} প্রক্রিয়া শুরু করা`,
        actionType: 'click',
        targetDescription: originalGoal,
        params: { goal: originalGoal },
        status: 'pending',
        expectedOutcome: 'উদ্দেশ্য অনুযায়ী কাঙ্ক্ষিত স্ক্রিন অবস্থা অর্জিত হবে',
        retryCount: 0,
      },
    ];
  }
}
