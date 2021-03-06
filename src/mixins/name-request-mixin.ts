// Libraries
import { Component, Mixins } from 'vue-property-decorator'
import { NameRequestStates, EntityTypes } from '@/enums'
import { NameRequestIF } from '@/interfaces'
import { DateMixin } from '@/mixins'

/**
 * Name request mixin for processing NR responses
 */
@Component({})
export default class NameRequestMixin extends Mixins(DateMixin) {
  /**
   * Generates name request state for the store.
   * @param nr the name request response payload
   * @param filingId the filing id
   */
  generateNameRequestState (nr: any, filingId: number): NameRequestIF {
    const approvedName = nr.names.find(name => name.state === NameRequestStates.APPROVED)?.name

    return {
      nrNumber: nr.nrNum,
      // TODO: Update entityType to use nr.requestTypeCd when namex supports our entity types
      entityType: EntityTypes.BCOMP,
      filingId: filingId,
      applicant: {
        // Address Information
        addressLine1: nr.applicants.addrLine1,
        addressLine2: nr.applicants.addrLine2,
        addressLine3: nr.applicants.addrLine3,
        city: nr.applicants.city,
        countryTypeCode: nr.applicants.countryTypeCd,
        postalCode: nr.applicants.postalCd,
        stateProvinceCode: nr.applicants.stateProvinceCd,

        // Application contact information
        emailAddress: nr.applicants.emailAddress,
        phoneNumber: nr.applicants.phoneNumber,

        // Application name information
        firstName: nr.applicants.firstName,
        middleName: nr.applicants.middleName,
        lastName: nr.applicants.lastName
      },
      details: {
        approvedName: approvedName,
        consentFlag: nr.consentFlag,
        expirationDate: nr.expirationDate,
        status: nr.state
      }
    }
  }

  /**
   * Returns True if the Name Request data is valid.
   * @param nr the name request response payload
   * */
  isNrValid (nr: any): boolean {
    // TODO: implement check for supported entity types when namex supports BCOMP
    return Boolean(nr &&
      nr.state &&
      nr.expirationDate &&
      nr.names?.length > 0 &&
      nr.nrNum &&
      nr.requestTypeCd)
  }

  /**
   * Returns the Name Request's state.
   * @param nr the name request response payload
   */
  getNrState (nr: any): NameRequestStates {
    // Ensure a NR payload is provided.
    if (!nr) {
      return null
    }

    // If the NR is expired, it is not consumable.
    const expireDays = this.daysFromToday(nr.expirationDate)
    if (isNaN(expireDays) || expireDays < 1) {
      return NameRequestStates.EXPIRED
    }

    // If the NR is awaiting consent, it is not consumable.
    if (nr.state === NameRequestStates.CONDITIONAL && nr.consentFlag !== 'R') {
      return NameRequestStates.NEED_CONSENT
    }

    // If the NR's root state is not APPROVED, it is not consumable.
    if (nr.state !== NameRequestStates.APPROVED) {
      return NameRequestStates.NOT_APPROVED
    }

    // NB: from here down, the NR is APPROVED (but maybe not consumable)

    // If the NR has already been consumed, it is not consumable.
    if (nr.names.some(name => name.consumptionDate)) {
      return NameRequestStates.CONSUMED
    }

    // Otherwise, the NR is consumable.
    return NameRequestStates.APPROVED
  }
}
