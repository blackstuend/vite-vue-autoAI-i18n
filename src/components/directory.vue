<template>
  <Layout>
    <div class="py-3 px-6 flex items-center">
      <CommonSearchInput v-model="searchInput" class="mr-6 !w-full" block />
      <div class="ml-auto flex">
        <CommonIconButton
          v-if="directoryStore.typeIsContact"
          class="text-hint text-2xl"
          icon="i-material-symbols:qr-code"
          @click="$router.push('/directory/qrcode')"
        ></CommonIconButton>
        <el-dropdown trigger="click">
          <CommonIconButton class="text-hint text-2xl" icon="i-material-symbols:add-circle-outline"></CommonIconButton>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$router.push('/directory/addContact')">
                <span i-hlo-user-plus mr-2></span>
                新增联络人
              </el-dropdown-item>
              <el-dropdown-item @click="$router.push('/directory/addGroup')">
                <span i-material-symbols:group-add-outline mr-2></span>
                建立群组
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="flex-1 text-center text-subHeading border-b b-light">
      <el-tabs v-model="directoryStore.selectedType" stretch>
        <el-tab-pane label="联络人列表" :name="DirectoryListType.Contact">
          <template #label>
            <span> 联络人列表 </span>
          </template>
          <div class="user-count">联络人 {{ contactFilterList?.length || '0' }}</div>
          <UserList
            v-if="contactFilterList"
            v-slot="{ item }"
            :items="contactFilterList"
            key-field="contactId"
            @visible-list-update="contactListVisibleUpdate"
          >
            <ContactDirectoryListItem
              :item="item"
              :is-active="id === item.contactId"
              @click="goContactInfoPage(item)"
            ></ContactDirectoryListItem>
          </UserList>
        </el-tab-pane>
        <el-tab-pane label="群组列表" :name="DirectoryListType.Group">
          <template #label>
            <ElBadge :value="inviteGroupCount" :show-zero="false">
              <span> 群组列表 </span>
            </ElBadge>
          </template>
          <div class="user-count">群组 {{ groupFilterList?.length || '0' }}</div>
          <UserList v-if="groupFilterList" v-slot="{ item }" :items="groupFilterList" key-field="groupId">
            <GroupDirectoryListItem
              :item="item"
              :is-active="id === item.groupId?.toString()"
              @click="goGroupInfoPage(item)"
            ></GroupDirectoryListItem>
          </UserList>
        </el-tab-pane>
        <el-tab-pane
          v-if="maybeKnowContactCount && maybeKnowContactCount > 0"
          label="可能认识"
          :name="DirectoryListType.Stranger"
        >
          <template #label>
            <ElBadge :value="maybeKnowContactCount" :show-zero="false">
              <span> 可能认识 </span>
            </ElBadge>
          </template>
          <div class="user-count">可能认识 {{ mayKnownContactFilterList?.length || '0' }}</div>
          <UserList
            v-if="mayKnownContactFilterList"
            v-slot="{ item }"
            :items="mayKnownContactFilterList"
            key-field="memberId"
          >
            <ContactDirectoryMayKnownItem :item="item"></ContactDirectoryMayKnownItem>
          </UserList>
        </el-tab-pane>
      </el-tabs>
    </div>
    <LayoutAppFooter></LayoutAppFooter>
    <template #sidebar> <router-view></router-view> </template>
    <template #mobile> <router-view></router-view> </template>
  </Layout>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { DirectoryListType } from '@/store/directory';
import { Group } from '~/services/api/group';
import { Contact } from '~/services/api/member';

const searchInput = ref<string>('');

const router = useRouter();
const { getSpecificParamValue } = useRouteInfo();
const directoryStore = useDirectoryStore();
const userStore = useUserStore();
const { includesIgnoreCase } = useText();

const id = computed(() => {
  return getSpecificParamValue.value('id');
});

const { contactList, groupList, maybeKnowContactList } = storeToRefs(directoryStore);

const contactFilterList = computed(() => {
  return contactList.value?.filter((item) => {
    const myNoteBookName = '嗨聊记事本';
    if (item.contactId === userStore.profile?.id) {
      if (searchInput.value === '') {
        return true;
      }

      // searchInput.value 只要有包含 '记事本' 其他一個字 会显示
      return myNoteBookName.split('').some((char) => searchInput.value.includes(char));
    }

    return includesIgnoreCase(item.name, searchInput.value);
  });
});

const groupFilterList = computed(() => {
  return groupList.value?.filter((item) => {
    return includesIgnoreCase(item.groupName, searchInput.value);
  });
});

const mayKnownContactFilterList = computed(() => {
  return maybeKnowContactList.value?.filter((item) => {
    return includesIgnoreCase(item.nickname, searchInput.value);
  });
});

function goContactInfoPage(item: Contact) {
  router.push(`/directory/contact/${item.contactId}/info`);
}

function goGroupInfoPage(item: Group) {
  if (item.invitationStatus === 0) {
    return;
  }

  router.push(`/directory/group/${item.groupId}/info`);
}

function contactListVisibleUpdate(startIndex: number, endIndex: number) {
  const ids = directoryStore.contactList
    .slice(startIndex, endIndex)
    .filter((item) => {
      return item.isTwoWayContact;
    })
    .map((item) => {
      return item.contactId;
    });

  directoryStore.updateContactActivities(ids);
}

const inviteGroupCount = computed(() => {
  return groupList.value?.filter((item) => {
    return item.invitationStatus === 0;
  }).length;
});

const maybeKnowContactCount = computed(() => {
  return maybeKnowContactList.value?.length;
});
</script>

<style scoped lang="scss">
a.router-link-active {
  color: rgba(0, 0, 0, 0.8);
}

.tab-link {
  @apply p-4 w-[50%] text-black hover:text-gray-400 cursor-pointer text-sm;

  &-active {
    color: #000 !important;
  }
}

:deep(.el-badge__content) {
  margin-right: -15px;
}

:deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;

  .el-tabs__content {
    overflow: auto;
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
  }

  .el-tab-pane {
    display: flex;
    flex: 1;
    overflow: auto;
    flex-direction: column;
  }

  .el-tabs__nav-scroll {
    @apply px-4;
  }
}

:deep(.el-tabs__content) {
  overflow: auto;
  flex: 1 1 0;
}

:deep(.el-tabs__nav-scroll) {
  @apply px-4;
}

.user-count {
  @apply text-sm text-left px-4 pt-4 pb-2 text-bold;
}
</style>
