
import saveTabValues from './saveTabValues.js';

export default function addAPItableRow(){

    saveTabValues();

    let n_rows_current = document.querySelector("#API_table > tbody:nth-child(1)").rows.length;

    document.querySelector("#API_table > tbody:nth-child(1)").innerHTML +=
          `<tr>
            <td><input style="width: 120px;" class="tableField" type="text" id="name_row${n_rows_current}" value=""  /></td>
            <td><input style="width: 120px;" class="tableField" type="text" id="cas_row${n_rows_current}" value=""  /></td>
            <td><input style="width: 120px;" class="tableField" type="text" id="class_row${n_rows_current}" value=""  /></td>
            <td><input style="width: 120px;" class="tableField" type="text" id="MW_row${n_rows_current}" value=""  /></td>
            <td><input style="width: 120px;" class="tableField" type="text" id="KOW_n_row${n_rows_current}" value=""  /></td>
            <td><input style="width: 120px;" class="tableField" type="text" id="Pv_row${n_rows_current}" value=""  /></td>
            <td><input style="width: 120px;" class="tableField" type="text" id="S_row${n_rows_current}" value=""  /></td>
            <td><input style="width: 120px;" class="tableField" type="text" id="pKa_row${n_rows_current}" value=""  /></td>
            <td><input style="width: 120px;" class="tableField" type="text" id="f_u_row${n_rows_current}" value=""  /></td>
            <td><input style="width: 120px;" class="tableField" type="text" id="f_f_row${n_rows_current}" value=""  /></td>
          </tr>`


    document.querySelector("#API_table2 > tbody:nth-child(1)").innerHTML +=
      `<tr>
        <td><input style="width: 120px;" class="tableField2" type="text" id="API_ID_tab2_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2" type="text" id="Kp_ps_n_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2" type="text" id="Kp_as_n_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2" type="text" id="Kp_sd_n_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2" type="text" id="KOC_n_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2" type="text" id="k_bio_wwtp_n_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2" type="text" id="k_bio_sw1_n_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2" type="text" id="T_bio_sw_n_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2" type="text" id="k_hydro_sw_n_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2" type="text" id="T_hydro_sw_n_row${n_rows_current}" value="" readonly /></td>
      </tr>`

    document.querySelector("#API_table2alt > tbody:nth-child(1)").innerHTML +=
      `<tr>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="API_ID_tab2alt_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="Kp_ps_alt_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="Kp_as_alt_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="Kp_sd_alt_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="KOC_alt_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="k_bio_wwtp_alt_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="k_bio_sw1_alt_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="T_bio_sw_alt_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="k_hydro_sw_alt_row${n_rows_current}" value="" readonly /></td>
        <td><input style="width: 120px;" class="tableField2alt" type="text" id="T_hydro_sw_alt_row${n_rows_current}" value="" readonly /></td>
      </tr>`

    var fields = document.querySelectorAll("table input[type='text']");
    for (let i = 0; i < fields.length; i++) {
      fields[i].readOnly = true;
      fields[i].style.border = "none";
    }

  }