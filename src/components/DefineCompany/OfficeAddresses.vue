<template>
  <div id="office-addresses">
    <!-- Address Review -->
    <template v-if="!isEditing">
      <v-layout row id="summary-registered-address">
        <v-flex md4><label><strong>Registered Office</strong></label></v-flex>
        <v-flex md4>
          <label><strong>Mailing Address</strong></label>
          <mailing-address
            v-if="!isEmptyAddress(mailingAddress)"
            :address="mailingAddress"
            :editing="false"/>
          <div v-else>(Not entered)</div>
        </v-flex>

        <v-flex md4>
          <label><strong>Delivery Address</strong></label>
          <delivery-address
            v-if="!isEmptyAddress(deliveryAddress) && !inheritMailingAddress"
            :address="deliveryAddress"
            :editing="false"/>
          <div v-else-if="isEmptyAddress(deliveryAddress)">(Not entered)</div>
          <div v-else>Same as Mailing Address</div>
        </v-flex>
      </v-layout>

      <v-layout row id="summary-records-address" v-if="entityFilter(EntityTypes.BCOMP)" class="mt-4">
        <v-flex md4><label><strong>Records Office</strong></label></v-flex>
        <v-flex md4>
          <label><strong>Mailing Address</strong></label>
          <mailing-address
            v-if="!inheritRegisteredAddress && !isEmptyAddress(recMailingAddress)"
            :address="recMailingAddress"
            :editing="false"/>
          <div v-else-if="isEmptyAddress(recMailingAddress)">(Not entered)</div>
          <div v-else>Same as Registered Office</div>
        </v-flex>

        <v-flex md4>
          <label><strong>Delivery Address</strong></label>
          <delivery-address
            v-if="!inheritRecMailingAddress && !inheritRegisteredAddress && !isEmptyAddress(recDeliveryAddress)"
            :address="recDeliveryAddress"
            :editing="false"/>
          <div v-else-if="isEmptyAddress(recDeliveryAddress)">(Not entered)</div>
          <div v-else-if="inheritRegisteredAddress">Same as Registered Office</div>
          <div v-else>Same as Mailing Address</div>
        </v-flex>
      </v-layout>
    </template>

    <!-- Address Form -->
    <v-card flat v-else>
      <ul class="list address-list address-form">
        <!-- Registered Office -->
        <div class="address-edit-header">
          <label class="address-edit-title">Registered Office</label>
        </div>

        <!-- Registered Mailing Address -->
        <li class="address-list-container">
          <div class="meta-container">
            <label>Mailing Address</label>
            <div class="meta-container__inner">
              <div class="address-wrapper">
                <mailing-address
                  id="address-registered-mailing"
                  :address="mailingAddress"
                  :editing="true"
                  :schema="addressSchema"
                  @update:address="updateAddress('mailingAddress', mailingAddress, $event)"
                  @valid="updateAddressValid('mailingAddress', $event)"/>
              </div>
            </div>
          </div>
        </li>

        <!-- Registered Delivery Address -->
        <li class="address-list-container">
          <div class="meta-container">
            <label>Delivery Address</label>
            <div class="meta-container__inner">
              <div class="form__row">
                <v-checkbox
                  id="registered-mailing-same-chkbx"
                  class="inherit-checkbox"
                  label="Same as Mailing Address"
                  v-model="inheritMailingAddress"
                  v-on:change="setDeliveryAddressToMailingAddress()"/>
              </div>
              <div class="address-wrapper"
                   v-if="!isSame(mailingAddress, deliveryAddress, 'actions') || !inheritMailingAddress">
                <delivery-address
                  id="address-registered-delivery"
                  v-if="!inheritMailingAddress"
                  :address="deliveryAddress"
                  :editing="true"
                  :schema="addressSchema"
                  @update:address="updateAddress('deliveryAddress', deliveryAddress, $event)"
                  @valid="updateAddressValid('deliveryAddress', $event)"/>
              </div>
            </div>
          </div>
        </li>

        <!--Records Office Address -->
        <template v-if="entityFilter(EntityTypes.BCOMP)">
          <div class="address-edit-header">
            <label class="address-edit-title">Records Office</label>
            <v-checkbox
              id="records-mailing-same-chkbx"
              class="records-inherit-checkbox"
              label="Same as Registered Office"
              v-model="inheritRegisteredAddress"
              v-on:change="setRecordOfficeToRegisteredOffice()"/>
          </div>

          <template v-if="!inheritRegisteredAddress">
            <!-- Records Mailing Address -->
            <li class="address-list-container">
              <div class="meta-container">
                <label>Mailing Address</label>
                <div class="meta-container__inner">
                  <div class="address-wrapper">
                    <mailing-address
                      id="address-records-mailing"
                      :address="recMailingAddress"
                      :editing="true"
                      :schema="addressSchema"
                      @update:address="updateAddress('recMailingAddress', recMailingAddress, $event)"
                      @valid="updateAddressValid('recMailingAddress', $event)"/>
                  </div>
                </div>
              </div>
            </li>

            <!-- Records Delivery Address -->
            <li class="address-list-container">
              <div class="meta-container">
                <label>Delivery Address</label>
                <div class="meta-container__inner">
                  <div class="form__row">
                    <v-checkbox
                      class="inherit-checkbox"
                      label="Same as Mailing Address"
                      v-model="inheritRecMailingAddress"
                      v-on:change="setRecordDeliveryAddressToMailingAddress()"/>
                  </div>
                  <div
                    class="address-wrapper"
                    v-if="!isSame(recMailingAddress, recDeliveryAddress, 'actions') || !inheritRecMailingAddress">
                    <delivery-address
                      id="address-records-delivery"
                      :address="recDeliveryAddress"
                      :editing="true"
                      :schema="addressSchema"
                      @update:address="updateAddress('recDeliveryAddress', recDeliveryAddress, $event)"
                      @valid="updateAddressValid('recDeliveryAddress', $event)"/>
                  </div>
                </div>
              </div>
            </li>
          </template>
        </template>
      </ul>
    </v-card>
  </div>
</template>

<script lang="ts">
// Libraries
import { Component, Emit, Prop, Watch, Mixins } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { isEmpty } from 'lodash'

// Schemas
import { officeAddressSchema } from '@/schemas'

// Components
import BaseAddress from 'sbc-common-components/src/components/BaseAddress.vue'

// Interfaces
import { IncorporationAddressIf, AddressIF, StateModelIF } from '@/interfaces'

// Enums
import { EntityTypes } from '@/enums'

// Mixins
import { CommonMixin, EntityFilterMixin } from '@/mixins'

@Component({
  components: {
    'delivery-address': BaseAddress,
    'mailing-address': BaseAddress
  }
})
export default class OfficeAddresses extends Mixins(CommonMixin, EntityFilterMixin) {
  /**
   * Addresses object from the parent page.
   * If this is null then this is a new filing; otherwise these are the addresses from a draft/navigation
   * from other step.
   * This will be emitted back to the parent page when the addresses are updated.
   */
  @Prop({ default: null })
  readonly inputAddresses!: IncorporationAddressIf | null;

  // Whether to show the editable forms for the addresses (true) or just the static display addresses (false).
  @Prop({ default: true })
  private isEditing!: boolean;

  // Global state
  @State stateModel!: StateModelIF

  // Local Properties
  private addresses: IncorporationAddressIf | null = this.inputAddresses;

  // The 4 addresses that are the current state of the BaseAddress components:
  private mailingAddress = {} as AddressIF;
  private deliveryAddress = {} as AddressIF;
  private recMailingAddress = {} as AddressIF;
  private recDeliveryAddress = {} as AddressIF;

  // Validation events from BaseAddress:
  private mailingAddressValid: boolean = true;
  private deliveryAddressValid: boolean = true;
  private recMailingAddressValid: boolean = true;
  private recDeliveryAddressValid: boolean = true;

  private inheritMailingAddress: boolean = true;

  // State of the checkbox for determining whether or not the mailing address is the same as the delivery address
  // For Records Office
  private inheritRecMailingAddress: boolean = true;

  // State of the checkbox for determining whether the Record address is the same as the Registered address
  private inheritRegisteredAddress: boolean = true;

  // The Address schema containing Vuelidate rules.
  private addressSchema = officeAddressSchema;

  // Entity Enum
  readonly EntityTypes = EntityTypes;

  /** Called when component is created. */
  private created (): void {
    // on first load, determine inherited flags based on address values and update parent
    this.setAddresses(true)
    this.emitValid()
  }

  /**
   * Sets address data.
   * @param loadInheritedFlags used to update inherited flags based on isSame checks if true
   */
  private setAddresses (loadInheritedFlags: boolean): void {
    if (this.addresses.registeredOffice) {
      this.mailingAddress = this.addresses.registeredOffice.mailingAddress
      this.deliveryAddress = this.addresses.registeredOffice.deliveryAddress

      if (loadInheritedFlags) {
        this.inheritMailingAddress = this.isSame(
          this.addresses.registeredOffice.mailingAddress,
          this.addresses.registeredOffice.deliveryAddress
        )
      }
      if (this.entityFilter(EntityTypes.BCOMP)) {
        this.recMailingAddress = this.addresses.recordsOffice?.mailingAddress
        this.recDeliveryAddress = this.addresses.recordsOffice?.deliveryAddress

        if (loadInheritedFlags) {
          this.inheritRegisteredAddress = (
            this.isSame(
              this.addresses.registeredOffice.deliveryAddress,
              this.addresses.recordsOffice?.deliveryAddress
            ) &&
            this.isSame(
              this.addresses.registeredOffice.mailingAddress,
              this.addresses.recordsOffice?.mailingAddress
            )
          )

          this.inheritRecMailingAddress = this.isSame(
            this.addresses.recordsOffice?.mailingAddress,
            this.addresses.recordsOffice?.deliveryAddress
          )
        }
      }
    }
  }

  //
  // Getters (Computed Values)
  //
  /** Whether the address form is valid. */
  private get formValid (): boolean {
    return (
      this.deliveryAddressValid &&
      (this.inheritMailingAddress || this.mailingAddressValid) &&
      this.recDeliveryAddressValid &&
      (this.inheritRecMailingAddress || this.recMailingAddressValid)
    )
  }

  /** Whether the address object is empty. */
  private isEmptyAddress (address: AddressIF): boolean {
    return isEmpty(address)
  }

  //
  // Event Handlers
  //
  /** Sets the Registered Delivery Address to the Registered Mailing Address. */
  private setDeliveryAddressToMailingAddress (): void {
    if (this.inheritMailingAddress) {
      this.deliveryAddress = { ...this.mailingAddress }
      this.emitAddresses()
    }
  }

  /** Sets the Records office addresses to the Registered office addresses. */
  private setRecordOfficeToRegisteredOffice (): void {
    if (this.inheritRegisteredAddress) {
      this.recDeliveryAddress = { ...this.deliveryAddress }
      this.recMailingAddress = { ...this.mailingAddress }
      this.emitAddresses()
    } else {
      this.inheritRecMailingAddress = this.inheritMailingAddress
    }
  }

  /** Sets the Records Delivery Address to Records Mailing Address. */
  private setRecordDeliveryAddressToMailingAddress (): void {
    if (this.inheritRecMailingAddress) {
      this.recDeliveryAddress = { ...this.recMailingAddress }
      this.emitAddresses()
    }
  }

  private updateAddress (addressChangedEntity: string, baseAddress: AddressIF, newAddress: AddressIF): void {
    Object.assign(baseAddress, newAddress)
    switch (addressChangedEntity) {
      case 'mailingAddress':
        if (this.inheritMailingAddress) {
          this.deliveryAddress = { ...newAddress }
        }
        if (this.inheritRegisteredAddress) {
          this.recMailingAddress = { ...newAddress }
          this.recDeliveryAddress = { ...this.deliveryAddress }
        }
        break
      case 'deliveryAddress':
        if (this.inheritRegisteredAddress) {
          this.recDeliveryAddress = { ...newAddress }
        }
        break
      case 'recMailingAddress':
        if (this.inheritRecMailingAddress) {
          this.recDeliveryAddress = { ...newAddress }
        }
        break
      case 'recDeliveryAddress':
        // nothing to do
        break
      default:
        // eslint-disable-next-line no-console
        console.log(`Error: Address- ${addressChangedEntity} not found`)
    }
    this.emitAddresses()
  }

  /**
   * Keeps track of the validity of the specified address.
   * @param addressToValidate the address to set the validity of
   * @param isValid a boolean indicating the validity of the address
   */
  private updateAddressValid (addressToValidate: string, isValid: boolean): void {
    switch (addressToValidate) {
      case 'deliveryAddress':
        this.deliveryAddressValid = isValid
        break
      case 'mailingAddress':
        this.mailingAddressValid = isValid
        break
      case 'recDeliveryAddress':
        this.recDeliveryAddressValid = isValid
        break
      case 'recMailingAddress':
        this.recMailingAddressValid = isValid
        break
      default:
        // eslint-disable-next-line no-console
        console.log(`Error: Address- ${addressToValidate} not found`)
    }
    this.emitValid()
  }

  //
  // Watchers
  //
  @Watch('formValid')
  private onFormValidityChange (val: boolean): void {
    this.emitValid()
  }

  @Watch('stateModel.defineCompanyStep.officeAddresses', { deep: true, immediate: true })
  private updateAddresses (): void {
    this.addresses = this.inputAddresses
    this.setAddresses(false)
    this.emitValid()
  }

  //
  // Event Emitters
  //
  /** Emits the valid state of this address form. */
  @Emit('valid')
  private emitValid (): boolean {
    return this.formValid
  }

  /** Emits updated addresses object to the parent page. */
  @Emit('update:addresses')
  private emitAddresses (): object {
    if (this.entityFilter(EntityTypes.BCOMP)) {
      return {
        registeredOffice: {
          deliveryAddress: this.deliveryAddress,
          mailingAddress: this.mailingAddress
        },
        recordsOffice: {
          deliveryAddress: this.recDeliveryAddress,
          mailingAddress: this.recMailingAddress
        }
      }
    } else {
      return {
        registeredOffice: {
          deliveryAddress: this.deliveryAddress,
          mailingAddress: this.mailingAddress
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.address-list-container {
  padding: 1rem;
}

.meta-container {
  display: flex;
  flex-flow: column nowrap;
  position: relative;
}

.meta-container__inner {
  margin-top: 1rem;
}

label:first-child {
  font-weight: 700;
  &__inner {
    flex: 1 1 auto;
  }
}

@media (min-width: 768px) {
  .meta-container {
    flex-flow: row nowrap;

    label:first-child {
      flex: 0 0 auto;
      width: 12rem;
    }
  }

  .meta-container__inner {
    flex: 1 1 auto;
    margin-top: 0;
  }
}

.address-list .form {
  margin-top: 1rem;
}

@media (min-width: 768px) {
  .address-list .form {
    margin-top: 0rem;
  }
}

// Address Block Layout
.address-wrapper {
  margin-top: 0.5rem;
}

// Form Row Elements
.form__row + .form__row {
  margin-top: 0.25rem;
}

.form__row.three-column {
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  margin-right: -0.5rem;
  margin-left: -0.5rem;
}

.inherit-checkbox {
  margin-top: -3px;
  margin-left: -3px;
  padding: 0;
}

.records-inherit-checkbox {
  margin-top: 0rem;
  margin-left: 4.5rem;
  margin-bottom: -1.5rem;
  padding: 0;

  .v-messages {
    display: none !important;
  }
}

// Registered Office Address Form Behavior
.address-form {
  li:first-child {
    padding-bottom: 0;
  }
}

ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

// Editing Address Form
.address-edit-header {
  display: flex;
  background-color: rgba(1, 51, 102, 0.15);
  padding: 1.25rem;

  address-edit-title {
    font-size: 1rem;
    font-weight: bold;
    line-height: 1.375rem;
  }
}
</style>
