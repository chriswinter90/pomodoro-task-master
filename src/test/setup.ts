import { config } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// --- VCheckbox ---
const VCheckboxStub = defineComponent({
  name: 'VCheckbox',
  props: {
    modelValue: Boolean,
    label: String,
    color: String,
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        'input',
        {
          'type': 'checkbox',
          'checked': !!props.modelValue,
          ...attrs,
          'data-v-component': 'VCheckbox',
          'onChange': (e: Event) => {
            emit('update:modelValue', (e.target as HTMLInputElement).checked)
          },
        },
        slots.default?.(),
      )
  },
})

// --- VBtn ---
const VBtnStub = defineComponent({
  name: 'VBtn',
  props: {
    color: String,
    icon: String,
    type: String,
  },
  emits: ['click'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        'button',
        {
          'type': props.type || 'button',
          ...attrs,
          'data-v-component': 'VBtn',
          'onClick': (e: MouseEvent) => {
            emit('click', e)
            // If type=submit and inside a form, trigger form submission
            if (props.type === 'submit') {
              const form = (e.target as HTMLElement).closest('form')
              if (form) {
                form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }))
              }
            }
          },
        },
        slots.default?.(),
      )
  },
})

// --- VTextField ---
const VTextFieldStub = defineComponent({
  name: 'VTextField',
  props: {
    modelValue: [String, Number],
    type: String,
    label: String,
    required: Boolean,
    autofocus: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        'input',
        {
          'type': props.type || 'text',
          'value': props.modelValue,
          'label': props.label,
          'required': props.required,
          'autofocus': props.autofocus,
          ...attrs,
          'data-v-component': 'VTextField',
          'onInput': (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
        },
        slots.default?.(),
      )
  },
})

// --- VForm ---
// Simulates Vuetify form validation: sets valid=true when children have values
const VFormStub = defineComponent({
  name: 'VForm',
  props: {
    modelValue: Boolean,
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        'form',
        {
          ...attrs,
          'data-v-component': 'VForm',
          'onSubmit': (e: Event) => {
            e.preventDefault()
            emit('submit', e)
          },
        },
        slots.default?.(),
      )
  },
})

// --- VSwitch ---
const VSwitchStub = defineComponent({
  name: 'VSwitch',
  props: {
    modelValue: Boolean,
    label: String,
    hideDetails: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        'label',
        {
          ...attrs,
          'data-v-component': 'VSwitch',
        },
        [
          slots.prepend?.(),
          h(
            'input',
            {
              type: 'checkbox',
              checked: !!props.modelValue,
              onChange: (e: Event) => {
                emit('update:modelValue', (e.target as HTMLInputElement).checked)
              },
            },
          ),
          slots.append?.(),
        ],
      )
  },
})

// --- VSelect ---
const VSelectStub = defineComponent({
  name: 'VSelect',
  props: {
    modelValue: [String, Number, Boolean, Object, Array],
    items: Array,
    label: String,
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        'select',
        {
          'value': props.modelValue,
          ...attrs,
          'data-v-component': 'VSelect',
          'onInput': (e: Event) => emit('update:modelValue', (e.target as HTMLSelectElement).value),
        },
        [
          ...(props.items ?? []).map(item => {
            const isObj = typeof item === 'object' && item !== null
            const obj = isObj ? (item as { label?: string, title?: string, value?: string }) : null
            const label = obj ? (obj.label ?? obj.title ?? String(item)) : String(item)
            const value = obj ? (obj.value ?? item) : item
            return h('option', { value }, label)
          }),
          slots.default?.(),
        ],
      )
  },
})

// --- VTabs ---
const VTabsStub = defineComponent({
  name: 'VTabs',
  props: {
    modelValue: [String, Number],
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          'data-v-component': 'VTabs',
          'onClick': (e: Event) => {
            // Propagate VTab click to update modelValue
            const target = (e.target as HTMLElement).closest('[data-v-component="VTab"]') as HTMLElement | null
            if (target) {
              const value = target.dataset.value
              if (value !== null) {
                emit('update:modelValue', value)
              }
            }
          },
        },
        [
          slots.default?.(),
          slots.items?.(),
        ],
      )
  },
})

// --- VTab ---
const VTabStub = defineComponent({
  name: 'VTab',
  props: {
    value: [String, Number],
  },
  emits: ['click'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          'data-v-component': 'VTab',
          'data-value': String(props.value),
          'onClick': (e: MouseEvent) => emit('click', e),
        },
        slots.default?.(),
      )
  },
})

// --- Generic pass-through stubs ---
function createPassthroughStub(tagName: string, htmlTag = 'div') {
  return defineComponent({
    name: tagName,
    props: {
      modelValue: [String, Number, Boolean, Object, Array],
      width: [String, Number],
      height: [String, Number],
      maxWidth: [String, Number],
      title: String,
      subtitle: String,
    },
    emits: ['update:modelValue', 'click'],
    setup(_, { attrs, slots, emit }) {
      return () => {
        // Render all named slots plus default slot
        const children = Object.entries(slots)
          .filter(([_name]) => _name !== '_')
          .flatMap(([_name, fn]) => (typeof fn === 'function' ? fn() : fn))
        return h(
          htmlTag,
          {
            ...attrs,
            'data-v-component': tagName,
            'onClick': (e: Event) => emit('click', e),
          },
          children,
        )
      }
    },
  })
}

// Register all Vuetify stubs
const vuetifyStubs: Record<string, ReturnType<typeof defineComponent>> = {
  VCheckbox: VCheckboxStub,
  VBtn: VBtnStub,
  VTextField: VTextFieldStub,
  VForm: VFormStub,
  VList: createPassthroughStub('VList'),
  VListItem: createPassthroughStub('VListItem'),
  VDivider: createPassthroughStub('VDivider'),
  VIcon: createPassthroughStub('VIcon'),
  VOverlay: createPassthroughStub('VOverlay'),
  VCard: createPassthroughStub('VCard'),
  VCardTitle: createPassthroughStub('VCardTitle'),
  VCardText: createPassthroughStub('VCardText'),
  VCardActions: createPassthroughStub('VCardActions'),
  VDialog: createPassthroughStub('VDialog'),
  VSwitch: VSwitchStub,
  VSelect: VSelectStub,
  VTabs: VTabsStub,
  VTab: VTabStub,
}

config.global.stubs = { ...config.global.stubs, ...vuetifyStubs }
