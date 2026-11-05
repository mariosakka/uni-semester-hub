<script>
import {t} from "../../lib/strings.js";
import {groupTick} from "../../lib/shared.js";
import {legendInfo, typeName, typeLetter} from "../../lib/schedule.js";

// swatches reuse the CSS of the real blocks; one legend under both the grid and the phone agenda
export default {
  props: {D: Object},
  methods: {t, typeName, typeLetter},
  computed: { info() { groupTick.value; return legendInfo(this.D); } } // subgroup choice changes what is listed
};
</script>

<template>
  <div class="legend" role="group" :aria-label="t('schedule.legend.label')">
    <span class="d sdev">{{ t('schedule.legend.differs') }}</span>
    <span class="d scx">{{ t('schedule.legend.notHeld') }}</span>
    <span class="d off">{{ t('schedule.legend.dayOff') }}</span>
    <span class="d sunc">? {{ t('schedule.legend.unconfirmed') }}</span>
    <span class="d sextra">{{ t('schedule.legend.extra') }}</span>
    <span v-for="ty in info.types" :key="ty" class="d slb"><b class="lb lt">{{ typeLetter(ty) }}</b> {{ typeName(ty) }}</span>
    <span v-if="info.hasGroups" class="d slb"><b class="lb">{{ t('schedule.subgroup', {n: 2}) }}</b> {{ t('schedule.legend.subgroup') }}</span>
    <span v-if="info.room" class="d slb"><b class="lb">{{ info.room }}</b> {{ t('schedule.legend.room') }}</span>
    <span class="d slb"><b class="lb lo">{{ t('schedule.online') }}</b> {{ t('schedule.legend.online') }}</span>
    <span v-for="c in info.courses" :key="c.id" :class="'d cs c-' + (c.color || 'grey')">{{ c.short || c.title }}</span>
  </div>
</template>
