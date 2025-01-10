<template>
  <div class="flex flex-nowrap w-[100%]" :class="{ highlight: !isReply && settings.select.value.showCheckBox }">
    <div v-show="!isReply && settings.select.value.showCheckBox" class="pl-2 pt-2">
      <el-checkbox
        v-if="!disabledCheckbox"
        :model-value="isSelected"
        @change="(action: CheckboxValueType) => onChangeSelectMsg(action, msgItem)"
      />
      <div v-else class="h-14px w-14px bg-transparent"></div>
    </div>
    <div class="flex-1">
      <div
        :id="isReply ? undefined : `id-${msgItem.id}`"
        class="msg-container"
        :class="{
          'align-right': msgItem.isSender && !isReply,
          'align-left': !msgItem.isSender || isReply,
          'replay-width replay-bottom-underline': isReply,
        }"
      >
        <slot v-if="show" name="avatar">
          <div v-if="!msgItem.isSender || isReply" class="cursor-pointer">
            <common-avatar :src="avatar" :size="32" @click="onClickAvatar"></common-avatar>
          </div>
        </slot>
        <div
          ref="messageContentRef"
          class="msg-block"
          :class="isReply ? 'replay-width' : 'normal-width'"
          @contextmenu="onClickContextMenu($event, msgItem, isReply)"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd($event, msgItem, isReply)"
        >
          <div class="msg-section" :class="{ 'replay-width': isReply }">
            <div v-if="!msgItem.isSender" class="user">
              <div class="user-name">{{ userName }}</div>
              <div v-if="'userType' in msgItem && msgItem.userType" class="user-type">
                <el-image class="h-4" :src="msgItem.userType.icon" />
              </div>
            </div>
            <div v-else-if="msgItem.isSender && isReply" class="user">
              <div class="user-name">
                {{ replySenderName }}
              </div>
            </div>
            <div v-if="msgItem.isForward" class="text-primary text-[10px]">{{ t('forwardMessage') }}</div>
            <slot name="reply" />
            <slot name="content" />
          </div>
        </div>
        <div v-if="!isReply && !isCacheMessage" class="msg-time">
          {{ formatDate(msgItem.createTime) }}
        </div>
        <div
          v-if="!isReply && showIcon"
          class="w-4 h-4 cursor-pointer flex-shrink-0"
          :class="msgItem.isSender ? 'i-mdi:arrow-up-left-bold' : 'i-mdi:arrow-up-right-bold'"
          @click="goBackChat"
        ></div>
        <div v-if="msgItem.isSender && !isReply" class="read-tag">
          <div v-if="'msgStatus' in msgItem && msgItem.msgStatus === 'loading'" class="i-line-md:loading-loop"></div>
          <div v-else-if="'msgStatus' in msgItem && msgItem.msgStatus === 'failed'">
            <div i-mdi:close text-red></div>
          </div>
          <div v-else>
            <div v-if="msgItem.isRead" i-mdi:check-all></div>
            <div v-else i-mdi:check></div>
          </div>
        </div>
      </div>
    </div>
    <!--头像选单功能-->
    <el-dialog v-model="showDialog" width="150" append-to-body destroy-on-close @close="showDialog = false">
      <div class="flex flex-col flex-nowrap gap-2">
        <div class="flex gap-2 items-center py-1 border-b-1">
          <common-avatar :src="avatar" :size="20" class="flex-shrink-0"></common-avatar>
          <div>{{ userName }}</div>
        </div>
        <div
          v-show="canSendMsg"
          class="rounded-1 p-2 cursor-pointer hover:bg-gray-200 flex gap-2 items-center"
          @click="onClickTagUser"
        >
          <div class="i-mdi:account-tag-outline w-6 h-6"></div>
          <div>{{ t('tagMember') }}</div>
        </div>
        <div
          v-show="canCheckUserInfo"
          class="rounded-1 p-2 cursor-pointer hover:bg-gray-200 flex gap-2 items-center"
          @click="onClickShowUserInfo"
        >
          <div class="i-mdi:information-variant-circle-outline w-6 h-6"></div>
          <div>{{ t('viewCard') }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import type { CheckboxValueType } from 'element-plus';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { formatDate } from '@/utils/dayjs';
import type { InteractiveMessageType } from '@/models/chat';
import type { CacheInteractiveMessageType } from '@/store/cacheMessage';
import { CHAT_MSG_TYPE } from '@/constants/chat';

const props = defineProps<{ msgItem: InteractiveMessageType | CacheInteractiveMessageType; isReply: boolean }>();

const emit = defineEmits<{
  (e: 'update:showCheckbox', value: boolean): void;
}>();

const messageContentRef = ref<HTMLDivElement | null>(null);

const { paramsId } = useRouteInfo();
const router = useRouter();

const { settings, targetMessage, updateSelectedList, updateTargetMessage } = useContextMenu({ isInject: true });
const { context, myAuthority, getMemberAvatarById, context: groupContext } = useGroupInject();
const { showIcon } = usePinMessagePointBack({ isInject: true });
const { setTagName } = useTagUser({ isInject: true });
const { goPageWithSameParent } = useRouteInfo();

const show = useMessageAvatar({ isInject: true });

const showDialog = ref(false);
const canSendMsg = computed(() => {
  return !!myAuthority.value?.sendMessage && !myAuthority.value?.isBanPost;
});
const canCheckUserInfo = computed(() => {
  if (!myAuthority.value || !props.msgItem.senderId) {
    return false;
  }

  // [QYHICHAT-1431]无论权限是否开启，成员点击群主与管理员时，皆可查看名片
  const memberId = +props.msgItem.senderId.slice(1);
  const msgOwner = context.value.memberList?.find((m) => m.memberId === memberId);
  if (msgOwner?.isAdmin || msgOwner?.isManager) {
    return true;
  }

  return !!myAuthority.value.checkUserInfo;
});
const avatar = computed(() => {
  if (props.msgItem.senderId) {
    const id = Number(props.msgItem.senderId.slice(1));
    return getMemberAvatarById.value(id, userName.value) ?? '';
  }
  return '';
});

const userName = computed(() => {
  if (!myAuthority.value) {
    return props.msgItem.username;
  }

  if (groupContext.value.authority?.showGroupNumber) {
    const member = groupContext.value?.memberList?.find(
      (item) => item.memberId === Number(props.msgItem.senderId?.slice(1)),
    );

    if (!member) {
      return t('exitedMember');
    }

    let { nickname } = props.msgItem;
    if (groupContext.value?.authority.editGroupNickname && props.msgItem.groupNickname) {
      nickname = props.msgItem.groupNickname;
    }

    const isManager = ['admin', 'manager'].includes(myAuthority.value?.type ?? '');

    if (isManager) {
      return `${props.msgItem.username}(${nickname})`;
    }

    return nickname;
  }

  return props.msgItem.username;
});

const replySenderName = computed(() => {
  if (!myAuthority.value) {
    return '';
  }

  if (!myAuthority.value.showGroupNumber) {
    return props.msgItem.username;
  }

  const isManager = ['admin', 'manager'].includes(myAuthority.value.type);
  const nickname = groupContext.value?.authority?.editGroupNickname
    ? props.msgItem.groupNickname || props.msgItem.nickname
    : props.msgItem.nickname;
  return isManager ? `${props.msgItem.username}(${nickname})` : nickname;
});

const isSelected = computed(() => {
  return settings.value.select.value.selectedList.some((msg) => msg.historyId === props.msgItem.id);
});

function onClickContextMenu(
  event: MouseEvent,
  msgItem: InteractiveMessageType | CacheInteractiveMessageType,
  isReply: boolean,
) {
  if (isReply || !messageContentRef.value || ('msgStatus' in msgItem && msgItem.msgStatus === 'loading')) {
    return;
  }

  updateTargetMessage({ msgItem, isReply, domRef: messageContentRef.value });
}

const isCacheMessage = computed(() => {
  return 'msgStatus' in props.msgItem;
});

// fix iOS can not trigger contextmenu event
let startTime: number = 0;
function onTouchStart() {
  startTime = Date.now();
}

function onTouchEnd(event: TouchEvent, msgItem: InteractiveMessageType, isReply: boolean) {
  if (isReply || !messageContentRef.value) {
    return;
  }

  const touchTimeSpend = Date.now() - (!startTime ? Date.now() : startTime);
  if (!targetMessage.value.showMenu.value && touchTimeSpend >= 800) {
    updateTargetMessage({ msgItem, isReply, domRef: messageContentRef.value });
  }

  startTime = 0;
}

function onChangeSelectMsg(checked: CheckboxValueType, msgItem: InteractiveMessageType) {
  if (settings.value.select.value.type === 'forward') {
    // limit 10
    if (checked && settings.value.select.value.selectedList.length >= 10) {
      ElMessage.warning(t('maxMessageSelect'));
      return;
    }
  }

  const data = { historyId: msgItem.id, isSender: Boolean(msgItem.isSender), msgType: msgItem.msgType };

  updateSelectedList(checked ? 'add' : 'remove', [data]);
}

function onClickAvatar() {
  showDialog.value = canSendMsg.value || canCheckUserInfo.value;
}

function onClickTagUser() {
  setTagName(userName.value ?? '');
  showDialog.value = false;
}

function onClickShowUserInfo() {
  if (!props.msgItem.senderId || !paramsId.value) return;

  const memberId = +props.msgItem.senderId.slice(1);
  router.push({
    path: `/message/group/${paramsId.value}/chat/info`,
    query: { groupInfo: 'members', members: 'Member', memberId },
  });
  showDialog.value = false;
}

function goBackChat() {
  goPageWithSameParent('chat', { hash: `#id-${props.msgItem.id}` });
}

const disabledCheckbox = computed(() => {
  if (settings.value.select.value.type === 'forward') {
    // some message can't be select
    if (
      props.msgItem.msgType === CHAT_MSG_TYPE.TEXT ||
      props.msgItem.msgType === CHAT_MSG_TYPE.AUDIO ||
      props.msgItem.msgType === CHAT_MSG_TYPE.VIDEO ||
      props.msgItem.msgType === CHAT_MSG_TYPE.FILE ||
      props.msgItem.msgType === CHAT_MSG_TYPE.PICTURE
    ) {
      return false;
    }

    return true;
  }

  return false;
});

watch(
  () => settings.value.select.value.showCheckBox,
  (value) => {
    emit('update:showCheckbox', value);
  },
);
</script>
<style scoped lang="scss">
.msg-container {
  display: flex;
  gap: 8px;
  padding: 0.5rem 1rem;
  line-height: 1.5rem;
  max-width: 100%;
  position: relative;

  .replay-width {
    max-width: 100%;
  }

  .replay-bottom-underline {
    border-bottom: 1px solid #0000000d;
  }

  .msg-block {
    position: relative;
    /** disable iOS external contextmenu  */
    -webkit-touch-callout: none;
    -webkit-user-select: none;
  }
  .msg-section {
    font-size: 0.9rem;
    padding: 0.2rem 0.6rem;
    border-radius: 5px;
    white-space: pre-line;
    overflow-wrap: anywhere;
    max-width: 100%;

    .user {
      display: flex;
      justify-content: space-between;
    }
  }

  &.align-left {
    flex-direction: row;

    .msg-section {
      @apply bg-white dark:bg-gray-800;
    }
  }

  &.align-right {
    flex-direction: row-reverse;

    .msg-section {
      @apply bg-white dark:bg-gray-800;
    }
  }

  .user-name {
    font-size: 0.75rem;
    color: var(--chat-body-left-user-name-font-color, gray);
    padding-bottom: 4px;
    text-wrap: nowrap;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-type {
    margin-top: 0.2rem;
    margin-left: 1rem;
    display: flex;
    justify-content: flex-end;

    :deep(.el-image__inner) {
      width: auto;
    }
  }

  .msg-time {
    align-self: flex-end;
    font-size: 0.625rem;
    color: var(--chat-body-left-head-time-font-color);
  }
}

.read-tag {
  @apply text-blue-8 dark:text-white;
  position: absolute;
  right: 10px;
  bottom: 10px;
}

.user-avatar-container {
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  width: 32px;
}

.highlight:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

@media screen and (max-width: 767px) {
  .normal-width {
    /** 16px: redirect icon, 24px: time width, 16px: gap * 2 */
    max-width: calc(100% - 16px - 24px - 16px);
  }
}

@media screen and (min-width: 768px) {
  .normal-width {
    max-width: calc(90% - 10rem);
  }
}
</style>

<i18n>
{
  "en": {
    "forwardMessage": "Forwarded Message",
    "maxMessageSelect": "You can only select up to 10 messages",
    "tagMember": "Tag Member",
    "viewCard": "View Card", 
    "exitedMember": "Exited Member"
  },
  "zh": {
    "forwardMessage": "转发讯息",
    "maxMessageSelect": "最多只能选取10条消息",
    "tagMember": "标记成员",
    "viewCard": "查看名片",
    "exitedMember": "已退出成员"
  }
}
</i18n>

<i18n></i18n>
