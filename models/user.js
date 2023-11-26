import Model from './model.js';

export default class User extends Model {
    constructor()
    {
        super();
        this.addField('Name', 'string');
        this.addField('Email', 'email');        
        this.addField('Password', 'string');
        this.addField('Avatar', 'asset');
        this.addField('Created','integer');
        this.addField('VerifyCode','string');
        this.addField('Authorizations','object');

        this.setKey("Email");
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        instance.Password = "************";
        if (instance.VerifyCode !== "verified") instance.VerifyCode = "unverified";
        return instance;
    }
}